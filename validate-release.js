#!/usr/bin/env node

/**
 * RELEASE VALIDATION SCRIPT
 * 
 * This script validates that:
 * 1. Version in version.js matches package.json
 * 2. CHANGELOG.md has an entry for the current version
 * 3. releases.json has an entry for the current version
 * 
 * Run before committing version changes:
 *   node validate-release.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(color, symbol, message) {
    console.log(`${color}${symbol}${colors.reset} ${message}`);
}

function error(message) {
    log(colors.red, '✗', message);
}

function success(message) {
    log(colors.green, '✓', message);
}

function warning(message) {
    log(colors.yellow, '⚠', message);
}

function info(message) {
    log(colors.blue, 'ℹ', message);
}

// Get version from version.js
function getVersionFromVersionJs() {
    const versionPath = path.join(__dirname, 'frontend', 'js', 'version.js');
    
    if (!fs.existsSync(versionPath)) {
        error('version.js not found!');
        return null;
    }
    
    const content = fs.readFileSync(versionPath, 'utf8');
    
    // Extract major, minor, patch using regex
    const majorMatch = content.match(/major:\s*(\d+)/);
    const minorMatch = content.match(/minor:\s*(\d+)/);
    const patchMatch = content.match(/patch:\s*(\d+)/);
    
    if (!majorMatch || !minorMatch || !patchMatch) {
        error('Could not parse version from version.js');
        return null;
    }
    
    return {
        major: parseInt(majorMatch[1]),
        minor: parseInt(minorMatch[1]),
        patch: parseInt(patchMatch[1]),
        full: `${majorMatch[1]}.${minorMatch[1]}.${patchMatch[1]}`
    };
}

// Get version from package.json
function getVersionFromPackageJson() {
    const packagePath = path.join(__dirname, 'package.json');
    
    if (!fs.existsSync(packagePath)) {
        error('package.json not found!');
        return null;
    }
    
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return pkg.version;
}

// Check if CHANGELOG.md has entry for version
function checkChangelog(version) {
    const changelogPath = path.join(__dirname, 'CHANGELOG.md');
    
    if (!fs.existsSync(changelogPath)) {
        error('CHANGELOG.md not found!');
        return false;
    }
    
    const content = fs.readFileSync(changelogPath, 'utf8');
    
    // Look for [X.Y.Z] - YYYY-MM-DD pattern
    const pattern = new RegExp(`\\[${version.replace('.', '\\.')}\\]\\s*-\\s*\\d{4}-\\d{2}-\\d{2}`, 'g');
    return pattern.test(content);
}

// Check if releases.json has entry for version
function checkReleasesJson(version) {
    const releasesPath = path.join(__dirname, 'releases.json');
    
    if (!fs.existsSync(releasesPath)) {
        error('releases.json not found!');
        return false;
    }
    
    const releases = JSON.parse(fs.readFileSync(releasesPath, 'utf8'));
    
    if (!releases.releases || !Array.isArray(releases.releases)) {
        error('Invalid releases.json structure!');
        return false;
    }
    
    return releases.releases.some(r => r.version === version);
}

// Main validation
function validate() {
    console.log(`\n${colors.bold}=== Release Validation ===${colors.reset}\n`);
    
    let errors = 0;
    
    // 1. Get versions
    const versionJs = getVersionFromVersionJs();
    const packageJson = getVersionFromPackageJson();
    
    if (!versionJs || !packageJson) {
        error('Failed to read version files');
        process.exit(1);
    }
    
    info(`version.js: v${versionJs.full}`);
    info(`package.json: v${packageJson}`);
    
    // 2. Check if versions match
    console.log('');
    if (versionJs.full === packageJson) {
        success('Version numbers match');
    } else {
        error(`Version mismatch! version.js (${versionJs.full}) != package.json (${packageJson})`);
        errors++;
    }
    
    // 3. Check CHANGELOG.md
    const hasChangelog = checkChangelog(versionJs.full);
    if (hasChangelog) {
        success(`CHANGELOG.md has entry for v${versionJs.full}`);
    } else {
        error(`CHANGELOG.md missing entry for v${versionJs.full}`);
        warning('Add a section like:');
        console.log(`
## [${versionJs.full}] - ${new Date().toISOString().split('T')[0]}

### Added
- Feature 1
- Feature 2

### Fixed
- Bug fix 1
`);
        errors++;
    }
    
    // 4. Check releases.json
    const hasRelease = checkReleasesJson(versionJs.full);
    if (hasRelease) {
        success(`releases.json has entry for v${versionJs.full}`);
    } else {
        error(`releases.json missing entry for v${versionJs.full}`);
        warning('Add a release object like:');
        console.log(`
{
  "version": "${versionJs.full}",
  "date": "${new Date().toISOString().split('T')[0]}",
  "name": "Release Name",
  "type": "${versionJs.patch > 0 ? 'patch' : versionJs.minor > 0 ? 'minor' : 'major'}",
  "features": [],
  "bugfixes": []
}
`);
        errors++;
    }
    
    // Summary
    console.log(`\n${colors.bold}=== Summary ===${colors.reset}\n`);
    
    if (errors === 0) {
        success(`All checks passed! v${versionJs.full} is ready to release.`);
        console.log('');
        info('Next steps:');
        console.log(`  1. git commit -m "chore: Release v${versionJs.full}"`);
        console.log(`  2. git tag -a v${versionJs.full} -m "Release version ${versionJs.full}"`);
        console.log(`  3. git push origin <branch>`);
        console.log(`  4. git push origin v${versionJs.full}`);
        console.log('');
        process.exit(0);
    } else {
        error(`${errors} error(s) found! Fix them before releasing.`);
        console.log('');
        info('See RELEASE_PROCESS.md for detailed instructions.');
        console.log('');
        process.exit(1);
    }
}

// Run validation
validate();
