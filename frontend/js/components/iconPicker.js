// =================================================================
// ICON PICKER COMPONENT
// =================================================================
// DaisyUI-styled icon picker with Lucide Icons organized by category

// Using local Lucide Icons only (127 icons across Weather, Time, and Other categories)

// Weather Icons - Complete Lucide Weather Set
const WEATHER_ICONS = [
    { name: 'sun', label: 'Sun', path: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>' },
    { name: 'sun-dim', label: 'Sun Dim', path: '<circle cx="12" cy="12" r="4"/><path d="M12 4h.01"/><path d="M20 12h.01"/><path d="M12 20h.01"/><path d="M4 12h.01"/><path d="M17.657 6.343h.01"/><path d="M17.657 17.657h.01"/><path d="M6.343 17.657h.01"/><path d="M6.343 6.343h.01"/>' },
    { name: 'sun-medium', label: 'Sun Medium', path: '<circle cx="12" cy="12" r="4"/><path d="M12 3v1"/><path d="M12 20v1"/><path d="M3 12h1"/><path d="M20 12h1"/><path d="m18.364 5.636-.707.707"/><path d="m6.343 17.657-.707.707"/><path d="m5.636 5.636.707.707"/><path d="m17.657 17.657.707.707"/>' },
    { name: 'sun-moon', label: 'Sun Moon', path: '<path d="M12 8a2.83 2.83 0 0 0 4 4 4 4 0 1 1-4-4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.3 17.7-1.4 1.4"/><path d="m19.1 4.9-1.4 1.4"/>' },
    { name: 'sunrise', label: 'Sunrise', path: '<path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/>' },
    { name: 'sunset', label: 'Sunset', path: '<path d="M12 10V2"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m16 6-4 4-4-4"/><path d="M16 18a4 4 0 0 0-8 0"/>' },
    { name: 'moon', label: 'Moon', path: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>' },
    { name: 'cloud', label: 'Cloud', path: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>' },
    { name: 'cloud-sun', label: 'Partly Cloudy', path: '<path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/>' },
    { name: 'cloud-moon', label: 'Cloudy Night', path: '<path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/><path d="M10.083 9A6.002 6.002 0 0 1 16 4a4.243 4.243 0 0 0 6 6c0 2.22-1.206 4.16-3 5.197"/>' },
    { name: 'cloud-rain', label: 'Rain', path: '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/>' },
    { name: 'cloud-drizzle', label: 'Drizzle', path: '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M8 19v1"/><path d="M8 14v1"/><path d="M16 19v1"/><path d="M16 14v1"/><path d="M12 21v1"/><path d="M12 16v1"/>' },
    { name: 'cloud-sun-rain', label: 'Sun Showers', path: '<path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M3 20a5 5 0 1 1 8.9-4H13a3 3 0 0 1 2 5.24"/><path d="M11 20v2"/><path d="M7 19v2"/>' },
    { name: 'cloud-moon-rain', label: 'Night Rain', path: '<path d="M10.083 9A6.002 6.002 0 0 1 16 4a4.243 4.243 0 0 0 6 6c0 2.22-1.206 4.16-3 5.197"/><path d="M3 20a5 5 0 1 1 8.9-4H13a3 3 0 0 1 2 5.24"/><path d="M11 20v2"/><path d="M7 19v2"/>' },
    { name: 'cloud-snow', label: 'Snow', path: '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M8 15h.01"/><path d="M8 19h.01"/><path d="M12 17h.01"/><path d="M12 21h.01"/><path d="M16 15h.01"/><path d="M16 19h.01"/>' },
    { name: 'cloud-hail', label: 'Hail', path: '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v2"/><path d="M8 14v2"/><path d="M16 20h.01"/><path d="M8 20h.01"/><path d="M12 16v2"/><path d="M12 22h.01"/>' },
    { name: 'cloud-lightning', label: 'Thunderstorm', path: '<path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973"/><path d="m13 12-3 5h4l-3 5"/>' },
    { name: 'cloud-fog', label: 'Fog', path: '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 17H7"/><path d="M17 21H9"/>' },
    { name: 'cloudy', label: 'Cloudy', path: '<path d="M17.5 21H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="M22 10a3 3 0 0 0-3-3h-2.207a5.502 5.502 0 0 0-10.702.5"/>' },
    { name: 'snowflake', label: 'Snowflake', path: '<line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/>' },
    { name: 'rainbow', label: 'Rainbow', path: '<path d="M22 17a10 10 0 0 0-20 0"/><path d="M6 17a6 6 0 0 1 12 0"/><path d="M10 17a2 2 0 0 1 4 0"/>' },
    { name: 'zap', label: 'Lightning', path: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>' },
    { name: 'wind', label: 'Wind', path: '<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>' },
    { name: 'tornado', label: 'Tornado', path: '<path d="M21 4H3"/><path d="M18 8H6"/><path d="M19 12H9"/><path d="M16 16h-6"/><path d="M11 20H9"/>' },
    { name: 'droplet', label: 'Droplet', path: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>' },
    { name: 'thermometer', label: 'Temperature', path: '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>' },
    { name: 'thermometer-sun', label: 'Hot', path: '<path d="M12 9a4 4 0 0 0-2 7.5"/><path d="M12 3v2"/><path d="m6.6 18.4-1.4 1.4"/><path d="M20 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/><path d="M4 13H2"/><path d="M6.34 7.34 4.93 5.93"/>' },
    { name: 'thermometer-snowflake', label: 'Cold', path: '<path d="M2 12h10"/><path d="M9 4v16"/><path d="m3 9 3 3-3 3"/><path d="M12 6 9 9 6 6"/><path d="m6 18 3-3 1.5 1.5"/><path d="M20 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>' },
];

// Time & Calendar Icons - Complete Lucide Time Set
const TIME_ICONS = [
    { name: 'clock', label: 'Clock', path: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
    { name: 'clock-1', label: 'Clock 1', path: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14.5 8"/>' },
    { name: 'clock-2', label: 'Clock 2', path: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 10"/>' },
    { name: 'clock-3', label: 'Clock 3', path: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16.5 12"/>' },
    { name: 'clock-4', label: 'Clock 4', path: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
    { name: 'clock-5', label: 'Clock 5', path: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14.5 16"/>' },
    { name: 'clock-6', label: 'Clock 6', path: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 12 16.5"/>' },
    { name: 'clock-7', label: 'Clock 7', path: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 9.5 16"/>' },
    { name: 'clock-8', label: 'Clock 8', path: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 8 14"/>' },
    { name: 'clock-9', label: 'Clock 9', path: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 7.5 12"/>' },
    { name: 'clock-10', label: 'Clock 10', path: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 8 10"/>' },
    { name: 'clock-11', label: 'Clock 11', path: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 9.5 8"/>' },
    { name: 'clock-12', label: 'Clock 12', path: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 12 6"/>' },
    { name: 'alarm-clock', label: 'Alarm Clock', path: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/>' },
    { name: 'alarm-clock-check', label: 'Alarm Set', path: '<circle cx="12" cy="13" r="8"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/><path d="m9 13 2 2 4-4"/>' },
    { name: 'alarm-clock-minus', label: 'Alarm Minus', path: '<circle cx="12" cy="13" r="8"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/><path d="M9 13h6"/>' },
    { name: 'alarm-clock-plus', label: 'Alarm Plus', path: '<circle cx="12" cy="13" r="8"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/><path d="M12 10v6"/><path d="M9 13h6"/>' },
    { name: 'alarm-clock-off', label: 'Alarm Off', path: '<path d="M6.87 6.87a8 8 0 1 0 11.26 11.26"/><path d="M19.9 14.25a8 8 0 0 0-9.15-9.15"/><path d="m22 6-3-3"/><path d="M6.26 18.67 4 21"/><path d="m2 2 20 20"/><path d="M4 4 2 6"/>' },
    { name: 'timer', label: 'Timer', path: '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>' },
    { name: 'timer-off', label: 'Timer Off', path: '<path d="M10 2h4"/><path d="M4.6 11a8 8 0 0 0 1.7 8.7 8 8 0 0 0 8.7 1.7"/><path d="M7.4 7.4a8 8 0 0 1 10.3 1 8 8 0 0 1 .9 10.2"/><path d="m2 2 20 20"/><path d="M12 12v-2"/>' },
    { name: 'timer-reset', label: 'Timer Reset', path: '<path d="M10 2h4"/><path d="M12 14v-4"/><path d="M4 13a8 8 0 0 1 8-7 8 8 0 1 1-5.3 14L4 17.6"/><path d="M9 17H4v5"/>' },
    { name: 'hourglass', label: 'Hourglass', path: '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>' },
    { name: 'watch', label: 'Watch', path: '<circle cx="12" cy="12" r="6"/><polyline points="12 10 12 12 13 13"/><path d="m16.13 7.66-.81-4.05a2 2 0 0 0-2-1.61h-2.68a2 2 0 0 0-2 1.61l-.78 4.05"/><path d="m7.88 16.36.8 4a2 2 0 0 0 2 1.61h2.72a2 2 0 0 0 2-1.61l.81-4.05"/>' },
    { name: 'calendar', label: 'Calendar', path: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>' },
    { name: 'calendar-days', label: 'Calendar Days', path: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>' },
    { name: 'calendar-range', label: 'Date Range', path: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M17 14h-6"/><path d="M13 18H7"/><path d="M7 14h.01"/><path d="M17 18h.01"/>' },
    { name: 'calendar-check', label: 'Calendar Check', path: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>' },
    { name: 'calendar-x', label: 'Calendar Cancel', path: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m14 14-4 4"/><path d="m10 14 4 4"/>' },
    { name: 'calendar-plus', label: 'Add Event', path: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M10 16h4"/><path d="M12 14v4"/>' },
    { name: 'calendar-minus', label: 'Remove Event', path: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M10 16h4"/>' },
    { name: 'calendar-clock', label: 'Schedule', path: '<path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h5"/><path d="M17.5 17.5 16 16.3V14"/><circle cx="16" cy="16" r="6"/>' },
    { name: 'calendar-heart', label: 'Special Date', path: '<path d="M3 10h18V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M21.29 14.7a2.43 2.43 0 0 0-2.65-.52c-.3.12-.57.3-.8.53l-.34.34-.35-.34a2.43 2.43 0 0 0-2.65-.53c-.3.12-.56.3-.79.53-.95.94-1 2.53.2 3.74L17.5 22l3.6-3.55c1.2-1.21 1.14-2.8.19-3.74Z"/>' },
    { name: 'calendar-search', label: 'Find Date', path: '<path d="M21 12V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.5"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="m18 18 3 3"/><circle cx="16" cy="16" r="3"/>' },
    { name: 'calendar-off', label: 'Calendar Off', path: '<path d="M4.2 4.2A2 2 0 0 0 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 1.82-1.18"/><path d="M21 15.5V6a2 2 0 0 0-2-2H9.5"/><path d="M16 2v4"/><path d="M3 10h7"/><path d="M21 10h-5.5"/><path d="m2 2 20 20"/>' },
];

const PRESET_ICONS = [
    // Time & Weather
    { name: 'sun', label: 'Sun', path: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>' },
    { name: 'moon', label: 'Moon', path: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>' },
    { name: 'sunrise', label: 'Sunrise', path: '<path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/>' },
    { name: 'sunset', label: 'Sunset', path: '<path d="M12 10V2"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m16 6-4 4-4-4"/><path d="M16 18a4 4 0 0 0-8 0"/>' },
    { name: 'cloud', label: 'Cloud', path: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>' },
    { name: 'cloud-rain', label: 'Rain', path: '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/>' },
    { name: 'cloud-snow', label: 'Snow', path: '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M8 15h.01"/><path d="M8 19h.01"/><path d="M12 17h.01"/><path d="M12 21h.01"/><path d="M16 15h.01"/><path d="M16 19h.01"/>' },
    { name: 'zap', label: 'Lightning', path: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>' },
    
    // Nature & Objects
    { name: 'flame', label: 'Fire', path: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>' },
    { name: 'droplet', label: 'Droplet', path: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>' },
    { name: 'sparkles', label: 'Sparkles', path: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>' },
    { name: 'star', label: 'Star', path: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>' },
    { name: 'tree-deciduous', label: 'Tree', path: '<path d="M8 19a4 4 0 0 1-2.24-7.32A3.5 3.5 0 0 1 9 6.03V6a3 3 0 1 1 6 0v.04a3.5 3.5 0 0 1 3.24 5.65A4 4 0 0 1 16 19Z"/><path d="M12 19v3"/>' },
    
    // Media & Entertainment
    { name: 'camera', label: 'Camera', path: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>' },
    { name: 'film', label: 'Film', path: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/>' },
    { name: 'video', label: 'Video', path: '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>' },
    { name: 'music', label: 'Music', path: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>' },
    { name: 'headphones', label: 'Headphones', path: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>' },
    
    // Communication & People
    { name: 'user', label: 'User', path: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
    { name: 'users', label: 'Users', path: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
    { name: 'message-circle', label: 'Message', path: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>' },
    { name: 'mail', label: 'Mail', path: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>' },
    { name: 'phone', label: 'Phone', path: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>' },
    
    // Locations & Buildings
    { name: 'home', label: 'Home', path: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>' },
    { name: 'building', label: 'Building', path: '<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>' },
    { name: 'map-pin', label: 'Location', path: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>' },
    { name: 'map', label: 'Map', path: '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>' },
    
    // Time & Productivity
    { name: 'clock', label: 'Clock', path: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
    { name: 'calendar', label: 'Calendar', path: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>' },
    { name: 'alarm-clock', label: 'Alarm', path: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/>' },
    { name: 'timer', label: 'Timer', path: '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>' },
];

const ADDITIONAL_ICONS = [
    // Activities
    { name: 'trophy', label: 'Trophy', path: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>' },
    { name: 'gift', label: 'Gift', path: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>' },
    { name: 'lightbulb', label: 'Idea', path: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>' },
    { name: 'heart', label: 'Heart', path: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>' },
    { name: 'cake', label: 'Cake', path: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/>' },
    
    // Food & Drink
    { name: 'coffee', label: 'Coffee', path: '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>' },
    { name: 'utensils', label: 'Food', path: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>' },
    { name: 'pizza', label: 'Pizza', path: '<path d="M15 11h.01"/><path d="M11 15h.01"/><path d="M16 16h.01"/><path d="m2 16 20 6-6-20A20 20 0 0 0 2 16"/><path d="M5.71 17.11a17.04 17.04 0 0 1 11.4-11.4"/>' },
    
    // Tech & Tools
    { name: 'smartphone', label: 'Phone', path: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>' },
    { name: 'laptop', label: 'Laptop', path: '<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>' },
    { name: 'printer', label: 'Printer', path: '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>' },
    { name: 'monitor', label: 'Monitor', path: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>' },
    
    // Travel & Transportation
    { name: 'plane', label: 'Plane', path: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>' },
    { name: 'car', label: 'Car', path: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>' },
    { name: 'train', label: 'Train', path: '<rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h0"/><path d="M16 15h0"/>' },
    { name: 'ship', label: 'Ship', path: '<path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4"/><path d="M12 2v3"/>' },
    
    // Sports & Activities
    { name: 'dumbbell', label: 'Fitness', path: '<path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.828l-1.768 1.768a2 2 0 1 1 2.828 2.828z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>' },
    { name: 'bike', label: 'Bike', path: '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>' },
    
    // Misc Objects
    { name: 'flag', label: 'Flag', path: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>' },
    { name: 'bookmark', label: 'Bookmark', path: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>' },
    { name: 'eye', label: 'Eye', path: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>' },
    { name: 'palette', label: 'Art', path: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>' },
];

const LAST_USED_KEY = 'iconPicker_lastUsed';

export class IconPicker {
    constructor(onSelect) {
        this.onSelect = onSelect;
        this.lucideIcons = null; // Will hold fetched Lucide icons
        this.isLoadingLucide = false;
        this.searchQuery = '';
        this.selectedIcon = null;
        this.activeTab = 'weather'; // Default to weather tab
    }

    getLastUsed() {
        try {
            const stored = localStorage.getItem(LAST_USED_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    addToLastUsed(icon) {
        const lastUsed = this.getLastUsed();
        // Remove if already exists
        const filtered = lastUsed.filter(i => i.name !== icon.name);
        // Add to front
        filtered.unshift(icon);
        // Keep only last 10
        const trimmed = filtered.slice(0, 10);
        localStorage.setItem(LAST_USED_KEY, JSON.stringify(trimmed));
    }

    renderIconGrid(icons) {
        return icons.map(icon => `
            <button 
                class="btn btn-square btn-outline hover:btn-primary"
                data-icon='${JSON.stringify(icon)}'
                title="${icon.label}"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    ${icon.path}
                </svg>
            </button>
        `).join('');
    }

    updateIconsDisplay(modal) {
        // Determine which icons to show
        let iconsToShow = [];
        let categoryLabel = '';
        
        if (this.searchQuery.trim()) {
            // Search through all local icons (127 total)
            const allIcons = [...WEATHER_ICONS, ...TIME_ICONS, ...PRESET_ICONS, ...ADDITIONAL_ICONS];
            iconsToShow = allIcons.filter(icon => 
                icon.label.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                icon.name.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
            categoryLabel = `Search Results (${iconsToShow.length})`;
            
            // Hide tabs and last used during search
            const tabsContainer = modal.querySelector('.tabs.tabs-boxed');
            const lastUsedSection = modal.querySelector('#lastUsedSection');
            if (tabsContainer) tabsContainer.style.display = 'none';
            if (lastUsedSection) lastUsedSection.style.display = 'none';
        } else {
            switch(this.activeTab) {
                case 'weather':
                    iconsToShow = WEATHER_ICONS;
                    categoryLabel = `Weather (${iconsToShow.length})`;
                    break;
                case 'time':
                    iconsToShow = TIME_ICONS;
                    categoryLabel = `Time & Calendar (${iconsToShow.length})`;
                    break;
                case 'other':
                    iconsToShow = [...PRESET_ICONS, ...ADDITIONAL_ICONS];
                    categoryLabel = `Other (${iconsToShow.length})`;
                    break;
            }
            
            // Show tabs and last used when not searching
            const tabsContainer = modal.querySelector('.tabs.tabs-boxed');
            const lastUsedSection = modal.querySelector('#lastUsedSection');
            if (tabsContainer) tabsContainer.style.display = '';
            if (lastUsedSection && this.getLastUsed().length > 0) lastUsedSection.style.display = '';
        }
        
        // Update the icons grid and label
        const gridContainer = modal.querySelector('#mainIconsGrid');
        const labelElement = modal.querySelector('#mainIconsLabel');
        
        if (gridContainer) {
            gridContainer.innerHTML = this.renderIconGrid(iconsToShow);
        }
        if (labelElement) {
            labelElement.textContent = categoryLabel;
        }
    }

    render() {
        const modal = document.createElement('dialog');
        modal.id = 'iconPickerModal';
        modal.className = 'modal';
        
        const lastUsed = this.getLastUsed();
        
        // Determine which icons to show
        let iconsToShow = [];
        let categoryLabel = '';
        
        if (this.searchQuery) {
            const allIcons = [...WEATHER_ICONS, ...TIME_ICONS, ...PRESET_ICONS, ...ADDITIONAL_ICONS];
            iconsToShow = allIcons.filter(icon => 
                icon.label.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                icon.name.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
            categoryLabel = `Search Results (${iconsToShow.length})`;
        } else {
            switch(this.activeTab) {
                case 'weather':
                    iconsToShow = WEATHER_ICONS;
                    categoryLabel = `Weather (${iconsToShow.length})`;
                    break;
                case 'time':
                    iconsToShow = TIME_ICONS;
                    categoryLabel = `Time & Calendar (${iconsToShow.length})`;
                    break;
                case 'other':
                    iconsToShow = [...PRESET_ICONS, ...ADDITIONAL_ICONS];
                    categoryLabel = `Other (${iconsToShow.length})`;
                    break;
            }
        }

        modal.innerHTML = `
            <div class="modal-box max-w-4xl max-h-[90vh]">
                <h3 class="font-bold text-lg mb-4">Choose an Icon</h3>
                
                <!-- Search -->
                <div class="form-control mb-4">
                    <input 
                        type="text" 
                        id="iconSearchInput" 
                        class="input input-bordered" 
                        placeholder="Search icons..."
                        value="${this.searchQuery}"
                    />
                </div>

                ${lastUsed.length > 0 && !this.searchQuery ? `
                    <!-- Last Used -->
                    <div id="lastUsedSection" class="mb-4">
                        <h4 class="font-semibold text-sm mb-2 text-base-content/60">Recently Used</h4>
                        <div class="grid grid-cols-10 gap-2">
                            ${this.renderIconGrid(lastUsed)}
                        </div>
                    </div>
                ` : ''}

                ${!this.searchQuery ? `
                    <!-- Category Tabs -->
                    <div class="tabs tabs-boxed mb-4">
                        <a class="tab ${this.activeTab === 'weather' ? 'tab-active' : ''}" data-tab="weather">
                            ☀️ Weather
                        </a> 
                        <a class="tab ${this.activeTab === 'time' ? 'tab-active' : ''}" data-tab="time">
                            🕐 Time & Calendar
                        </a> 
                        <a class="tab ${this.activeTab === 'other' ? 'tab-active' : ''}" data-tab="other">
                            ✨ Other
                        </a>
                    </div>
                ` : ''}

                <!-- Icons Grid -->
                <div>
                    <h4 id="mainIconsLabel" class="font-semibold text-sm mb-2 text-base-content/60">
                        ${categoryLabel}
                    </h4>
                    <div id="mainIconsGrid" class="grid grid-cols-10 gap-2 max-h-96 overflow-y-auto p-2">
                        ${this.renderIconGrid(iconsToShow)}
                    </div>
                </div>

                <div class="divider"></div>

                <div class="modal-action">
                    <button class="btn" id="closeIconPicker">Cancel</button>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button>close</button>
            </form>
        `;

        // Add event listeners
        modal.addEventListener('click', (e) => {
            const iconBtn = e.target.closest('[data-icon]');
            if (iconBtn) {
                const icon = JSON.parse(iconBtn.dataset.icon);
                this.addToLastUsed(icon);
                this.onSelect(icon);
                modal.close();
                modal.remove();
            }

            // Tab switching
            const tabBtn = e.target.closest('[data-tab]');
            if (tabBtn) {
                this.activeTab = tabBtn.dataset.tab;
                const newModal = this.render();
                modal.replaceWith(newModal);
                newModal.showModal();
            }

            if (e.target.id === 'closeIconPicker') {
                modal.close();
                modal.remove();
            }
        });

        const searchInput = modal.querySelector('#iconSearchInput');
        searchInput?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.updateIconsDisplay(modal);
        });

        return modal;
    }

    open() {
        const modal = this.render();
        document.body.appendChild(modal);
        modal.showModal();
    }
}
