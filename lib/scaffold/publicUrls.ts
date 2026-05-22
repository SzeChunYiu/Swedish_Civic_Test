import publicUrlsConfig from '../../config/publicUrls.json';

export type PublicUrls = Readonly<typeof publicUrlsConfig>;

export const publicUrls: PublicUrls = Object.freeze({
  support: publicUrlsConfig.support,
  privacy: publicUrlsConfig.privacy,
  appAdsTxt: publicUrlsConfig.appAdsTxt,
});
