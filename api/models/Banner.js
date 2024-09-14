const Banner = require('./schema/banner');
const logger = require('~/config/winston');

const findOne = async function (query) {
  try {
    const banner = await Banner.query(query).exec();
    return banner[0] || null;
  } catch (error) {
    throw new Error(`Failed to find banner: ${error.message}`);
  }
};

/**
 * Retrieves the current active banner.
 * @returns {Promise<Object|null>} The active banner object or null if no active banner is found.
 */
const getBanner = async (user) => {
  try {
    const now = new Date().toISOString();

    const banners = await Banner.scan()
          .where('displayFrom').lt(now)
          .and()
          .where('displayTo').gt(now)
          .or()
          .where('displayTo').eq(null)
          .and()
          .where('type').eq('banner')
          .limit(1)
          .exec();

    const banner = banners[0] || null;

    if (!banner || banner.isPublic || user) {
      return banner;
    }

    return null;
  } catch (error) {
    logger.error('[getBanners] Error getting banners', error);
    throw new Error('Error getting banners');
  }
};

module.exports = { getBanner };
