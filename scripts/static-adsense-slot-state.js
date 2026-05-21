const STATIC_ADSENSE_CURRENT_USE_COPY_PATTERNS = [
  /This website\s+uses\s+(?:<[^>]+>\s*)?Google AdSense/i,
  /We use\s+(?:<[^>]+>\s*)?Google AdSense to show/i,
  /Google AdSense on the website and Google Mobile Ads/i,
  /Google AdSense web ads/i,
  /Den h[aä]r webbplatsen anv[aä]nder\s+(?:<[^>]+>\s*)?Google AdSense/i,
  /Vi anv[aä]nder\s+(?:<[^>]+>\s*)?Google AdSense f[oö]r att visa/i,
  /Google AdSense p[aå] webbplatsen och Google Mobile Ads/i,
  /Google AdSense-annonser p[aå] webben/i,
];

function readStaticAdSenseStringProperty(source, propertyName) {
  const pattern = new RegExp(`\\b${propertyName}\\s*:\\s*(['"])([\\s\\S]*?)\\1`);
  const match = String(source || '').match(pattern);
  return match ? match[2] : '';
}

function readStaticAdSenseSlotConfig(appSource) {
  const source = String(appSource || '');
  const slotsBlock = source.match(/\bslots\s*:\s*{([\s\S]*?)}/);
  return {
    anchor: slotsBlock ? readStaticAdSenseStringProperty(slotsBlock[1], 'anchor') : '',
    autoAds: /\bautoAds\s*:\s*true\b/.test(source),
    inline: slotsBlock ? readStaticAdSenseStringProperty(slotsBlock[1], 'inline') : '',
    publisherId: readStaticAdSenseStringProperty(source, 'publisherId'),
  };
}

function isRealStaticAdSenseSlotId(slotId) {
  return typeof slotId === 'string' && /^[0-9]{10,}$/.test(slotId) && !/^0+$/.test(slotId);
}

function staticAdSenseSlotsAreConfigured(config) {
  return (
    /^ca-pub-[0-9]{16}$/.test(config.publisherId || '') &&
    isRealStaticAdSenseSlotId(config.inline) &&
    isRealStaticAdSenseSlotId(config.anchor)
  );
}

function staticAdSenseSlotsAreConfiguredInSource(appSource) {
  return staticAdSenseSlotsAreConfigured(readStaticAdSenseSlotConfig(appSource));
}

function staticAdSenseCanLoad(config) {
  return /^ca-pub-[0-9]{16}$/.test(config.publisherId || '') && !!config.autoAds;
}

function staticAdSenseCanLoadInSource(appSource) {
  return staticAdSenseCanLoad(readStaticAdSenseSlotConfig(appSource));
}

function findStaticAdSenseCurrentUseCopyMatches(source) {
  return STATIC_ADSENSE_CURRENT_USE_COPY_PATTERNS.filter((pattern) => pattern.test(source));
}

function findCurrentUseAdSenseSlotStateCopyIssues(surface, appSource) {
  if (
    staticAdSenseCanLoadInSource(appSource) ||
    staticAdSenseSlotsAreConfiguredInSource(appSource)
  ) {
    return [];
  }

  return findStaticAdSenseCurrentUseCopyMatches(String(surface || '')).map(
    (pattern) =>
      `current-use AdSense copy requires reviewed inline and anchor slot IDs: ${pattern.source}`,
  );
}

function findStaticAdSenseSlotStateCopyIssues(indexSource, appSource) {
  if (
    staticAdSenseCanLoadInSource(appSource) ||
    staticAdSenseSlotsAreConfiguredInSource(appSource)
  ) {
    return [];
  }

  return [
    { label: 'index.html', source: String(indexSource || '') },
    { label: 'app.js', source: String(appSource || '') },
  ].flatMap(({ label, source }) =>
    findStaticAdSenseCurrentUseCopyMatches(source).map(
      (pattern) =>
        `${label} claims live Google AdSense use while reviewed web slot IDs are not configured: ${pattern.source}`,
    ),
  );
}

module.exports = {
  findCurrentUseAdSenseSlotStateCopyIssues,
  findStaticAdSenseCurrentUseCopyMatches,
  findStaticAdSenseSlotStateCopyIssues,
  readStaticAdSenseSlotConfig,
  staticAdSenseCanLoad,
  staticAdSenseCanLoadInSource,
  staticAdSenseSlotsAreConfigured,
  staticAdSenseSlotsAreConfiguredInSource,
};
