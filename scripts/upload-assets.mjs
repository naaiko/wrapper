import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import mime from 'mime';

const SUPABASE_URL = process.env.SUPABASE_URL;
// Supabase now supports secret keys (sb_secret_...). Keep backward-compat with service role env var.
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'app-assets';
const WORKSPACE_ROOT = path.resolve(process.env.WORKSPACE_ROOT || process.cwd());
const DEFAULT_TARGETS = ['docs/resources', 'docs/releases', 'releases.json', 'CHANGELOG.md'];
const TARGETS = (process.env.ASSET_TARGETS || '')
	.split(',')
	.map((p) => p.trim())
	.filter(Boolean);
const CONCURRENCY = Number(process.env.ASSET_UPLOAD_CONCURRENCY || '8');

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
	console.error('SUPABASE_URL en SUPABASE_SECRET_KEY (of SUPABASE_SERVICE_ROLE_KEY) zijn verplicht.');
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
	auth: { autoRefreshToken: false, persistSession: false }
});

function collectFiles(target) {
	const absTarget = path.resolve(WORKSPACE_ROOT, target);
	if (!fs.existsSync(absTarget)) {
		console.warn(`[SKIP] ${target} bestaat niet`);
		return [];
	}

	const stats = fs.statSync(absTarget);
	if (stats.isFile()) {
		return [absTarget];
	}

	const stack = [absTarget];
	const files = [];
	while (stack.length) {
		const current = stack.pop();
		const entries = fs.readdirSync(current, { withFileTypes: true });
		for (const entry of entries) {
			const full = path.join(current, entry.name);
			if (entry.isDirectory()) {
				stack.push(full);
			} else if (entry.isFile()) {
				files.push(full);
			}
		}
	}
	return files;
}

function toRelativeKey(absPath) {
	return path.relative(WORKSPACE_ROOT, absPath).replace(/\\/g, '/');
}

async function uploadOne(absPath) {
	const key = toRelativeKey(absPath);
	const buffer = fs.readFileSync(absPath);
	const contentType = mime.getType(absPath) || 'application/octet-stream';

	const { error } = await supabase.storage
		.from(SUPABASE_BUCKET)
		.upload(key, buffer, { contentType, upsert: true });

	if (error) {
		throw new Error(`Upload failed for ${key}: ${error.message}`);
	}
	return key;
}

async function run() {
	const targets = TARGETS.length ? TARGETS : DEFAULT_TARGETS;
	const files = targets.flatMap(collectFiles);

	if (!files.length) {
		console.error('Geen bestanden gevonden om te uploaden. Controleer ASSET_TARGETS of paden.');
		process.exit(1);
	}

	console.log(`Workspace: ${WORKSPACE_ROOT}`);
	console.log(`Bucket: ${SUPABASE_BUCKET}`);
	console.log(`Supabase URL: ${SUPABASE_URL}`);
	console.log(`Targets: ${targets.join(', ')}`);
	console.log(`Bestanden: ${files.length}`);
	console.log(`Concurrency: ${CONCURRENCY}`);

	let inFlight = 0;
	let cursor = 0;
	let uploaded = 0;
	let failures = 0;

	return new Promise((resolve) => {
		const next = () => {
			while (inFlight < CONCURRENCY && cursor < files.length) {
				const file = files[cursor++];
				inFlight++;
				uploadOne(file)
					.then((key) => {
						uploaded++;
						if (uploaded % 25 === 0 || uploaded === files.length) {
							console.log(`[OK] ${uploaded}/${files.length} -> ${key}`);
						}
					})
					.catch((err) => {
						failures++;
						console.error(`[FAIL] ${err.message}`);
					})
					.finally(() => {
						inFlight--;
						next();
					});
			}

			if (cursor === files.length && inFlight === 0) {
				resolve({ uploaded, failures, total: files.length });
			}
		};

		next();
	});
}

run()
	.then(({ uploaded, failures, total }) => {
		console.log(`
Klaar. Uploaded: ${uploaded}/${total}. Failures: ${failures}.`);
		if (failures > 0) {
			process.exit(1);
		}
	})
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
