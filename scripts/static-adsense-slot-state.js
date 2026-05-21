const AD_SENSE_CURRENT_USE_COPY_PATTERNS = [
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
    publisherId: readStaticAdSenseStringProperty(source, 'publisherId'),
    inline: slotsBlock ? readStaticAdSenseStringProperty(slotsBlock[1], 'inline') : '',
    anchor: slotsBlock ? readStaticAdSenseStringProperty(slotsBlock[1], 'anchor') : '',
  };
}

function isRealStaticAdSenseSlotId(slotId) {
  return typeof slotId === 'string' && /^[0-9]{10,}$/.test(slotId) && !/^0+$/.test(slotId);
}

function staticAdSenseSlotsAreConfiguredInSource(appSource) {
  const config = readStaticAdSenseSlotConfig(appSource);
  return (
    /^ca-pub-[0-9]{16}$/.test(config.publisherId || '') &&
    isRealStaticAdSenseSlotId(config.inline) &&
    isRealStaticAdSenseSlotId(config.anchor)
  );
}

function configuredStaticAdSenseSlotsForTest(appSource) {
  return String(appSource || '')
    .replace(/publisherId:\s*'[^']*'/, "publisherId: 'ca-pub-2451892671779738'")
    .replace(/inline:\s*'[^']*'/, "inline: '1234567890'")
    .replace(/anchor:\s*'[^']*'/, "anchor: '1234567891'");
}

function findCurrentUseAdSenseSlotStateCopyIssues(surface, appSource) {
  if (staticAdSenseSlotsAreConfiguredInSource(appSource)) return [];

  return AD_SENSE_CURRENT_USE_COPY_PATTERNS.filter((pattern) => pattern.test(surface)).map(
    (pattern) =>
      `current-use AdSense copy requires reviewed inline and anchor slot IDs: ${pattern.source}`,
  );
}

function findStaticAdSenseSlotStateCopyIssues(indexSource, appSource) {
  if (staticAdSenseSlotsAreConfiguredInSource(appSource)) return [];

  return [
    { label: 'index.html', source: String(indexSource || '') },
    { label: 'app.js', source: String(appSource || '') },
  ].flatMap(({ label, source }) =>
    AD_SENSE_CURRENT_USE_COPY_PATTERNS.filter((pattern) => pattern.test(source)).map(
      (pattern) =>
        `${label} claims live Google AdSense use while reviewed web slot IDs are not configured: ${pattern.source}`,
    ),
  );
}

module.exports = {
  AD_SENSE_CURRENT_USE_COPY_PATTERNS,
  configuredStaticAdSenseSlotsForTest,
  findCurrentUseAdSenseSlotStateCopyIssues,
  findStaticAdSenseSlotStateCopyIssues,
  isRealStaticAdSenseSlotId,
  readStaticAdSenseSlotConfig,
  staticAdSenseSlotsAreConfiguredInSource,
};
