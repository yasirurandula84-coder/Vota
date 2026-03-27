const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true },
    workMode: { type: String, default: 'public' }
});

module.exports = mongoose.model('Settings', SettingSchema);
