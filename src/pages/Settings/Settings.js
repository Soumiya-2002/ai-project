import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './Settings.css';

const Settings = () => {
    const [apiKey, setApiKey] = useState('sk_live_51M...');
    const [vapiKey, setVapiKey] = useState('8f92-s9d8-...');
    const [storageLimit, setStorageLimit] = useState(50);
    const [emailNotifs, setEmailNotifs] = useState(true);

    const handleSave = (e) => {
        e.preventDefault();
        toast.success("Settings saved successfully");
    };

    return (
        <div className="settings-page">
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Configure application parameters and integrations</p>

            <div className="settings-container">
                <form onSubmit={handleSave} className="settings-form">

                    <div className="settings-section">
                        <h2>API Configuration</h2>
                        <div className="form-group">
                            <label>NLM Ingest API Key</label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="setting-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>VAPI Voice API Key</label>
                            <input
                                type="password"
                                value={vapiKey}
                                onChange={(e) => setVapiKey(e.target.value)}
                                className="setting-input"
                            />
                        </div>
                    </div>

                    <div className="settings-section">
                        <h2>Storage & Limits</h2>
                        <div className="form-group">
                            <label>Max Storage per School (GB)</label>
                            <div className="range-wrapper">
                                <input
                                    type="range"
                                    min="10" max="500"
                                    value={storageLimit}
                                    onChange={(e) => setStorageLimit(e.target.value)}
                                />
                                <span>{storageLimit} GB</span>
                            </div>
                        </div>
                    </div>

                    <div className="settings-section">
                        <h2>Notifications</h2>
                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                id="emailNotifs"
                                checked={emailNotifs}
                                onChange={(e) => setEmailNotifs(e.target.checked)}
                            />
                            <label htmlFor="emailNotifs">Enable Weekly Email Reports</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" id="alertNotifs" defaultChecked />
                            <label htmlFor="alertNotifs">Enable Real-time Quality Alerts</label>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel">Reset</button>
                        <button type="submit" className="btn-save">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
