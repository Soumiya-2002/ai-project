import React, { useState } from 'react';
import api from '../../api/axios';

const AnswerSheetUpload = () => {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [extractedText, setExtractedText] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!file) {
            alert("Please select an image file.");
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        try {
            setIsLoading(true);
            setMessage('Uploading Image & Extracting Text...');
            setExtractedText('');

            const res = await api.post('/upload/answer-sheet', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.text) {
                setExtractedText(res.data.text);
                setMessage('Text extracted successfully!');
            }
            setIsLoading(false);

        } catch (err) {
            console.error(err);
            setMessage('Upload Failed: ' + (err.response?.data?.message || err.message));
            setIsLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Answer Sheet to Text</h2>

            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', borderRadius: '16px', background: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <form onSubmit={handleUpload}>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Upload Answer Sheet Image</label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept="image/*"
                            style={{ width: '100%', padding: '0.8rem', border: '1px dashed #d1d5db', borderRadius: '8px' }}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!file || isLoading}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: file && !isLoading ? '#000000' : '#9ca3af',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: file && !isLoading ? 'pointer' : 'not-allowed',
                            fontSize: '1rem'
                        }}
                    >
                        {isLoading ? 'Processing...' : 'Upload & Extract'}
                    </button>
                </form>

                {message && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: message.includes('success') ? '#ecfdf5' : '#fef2f2', color: message.includes('success') ? '#065f46' : '#991b1b', borderRadius: '8px', textAlign: 'center' }}>
                        {message}
                    </div>
                )}

                {extractedText && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Extracted Text</h3>
                        <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                            {extractedText}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnswerSheetUpload;
