const Preset = require('./schema/presetSchema');
const { logger } = require('~/config');

const getPreset = async (user, presetId) => {
  try {
    return await Preset.findOne({ user, presetId });
  } catch (error) {
    logger.error('[getPreset] Error getting single preset', error);
    return { message: 'Error getting single preset' };
  }
};

module.exports = {
  Preset,
  getPreset,
  getPresets: async (user, filter) => {
    try {
      const query = { ...filter, user };

      console.log("query", query)

      const presets = await Preset.scan(query).exec();

      const defaultValue = 10000;

      if (!presets || !presets.length) {
        return Promise.resolve([]);
      }

      console.log("presets", presets)
      presets.sort((a, b) => {
        let orderA = a.order !== undefined ? a.order : defaultValue;
        let orderB = b.order !== undefined ? b.order : defaultValue;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        return b.updatedAt - a.updatedAt;
      });

      return presets;
    } catch (error) {
      logger.error('[getPresets] Error getting presets', error);
      return { message: 'Error retrieving presets' };
    }
  },
  savePreset: async (user, { presetId, newPresetId, defaultPreset, ...preset }) => {
    try {
      const setter = { $set: {} };
      const update = { presetId, ...preset };
      if (preset.tools && Array.isArray(preset.tools)) {
        update.tools =
          preset.tools
            .map((tool) => tool?.pluginKey ?? tool)
            .filter((toolName) => typeof toolName === 'string') ?? [];
      }
      if (newPresetId) {
        update.presetId = newPresetId;
      }

      if (defaultPreset) {
        update.defaultPreset = defaultPreset;
        update.order = 0;

        const currentDefault = await Preset.findOne({ defaultPreset: true, user });

        if (currentDefault && currentDefault.presetId !== presetId) {
          await Preset.findByIdAndUpdate(currentDefault._id, {
            $unset: { defaultPreset: '', order: '' },
          });
        }
      } else if (defaultPreset === false) {
        update.defaultPreset = undefined;
        update.order = undefined;
        setter['$unset'] = { defaultPreset: '', order: '' };
      }

      setter.$set = update;
      console.log("setter", setter)
      return await Preset.findOneAndUpdate({ presetId, user }, setter, { new: true, upsert: true });
    } catch (error) {
      logger.error('[savePreset] Error saving preset', error);
      return { message: 'Error saving preset' };
    }
  },
  deletePresets: async (user, filter) => {
    // let toRemove = await Preset.find({ ...filter, user }).select('presetId');
    // const ids = toRemove.map((instance) => instance.presetId);
    let deleteCount = await Preset.deleteMany({ ...filter, user });
    return deleteCount;
  },
};
