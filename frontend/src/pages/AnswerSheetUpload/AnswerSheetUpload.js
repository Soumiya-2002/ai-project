import React, { useState } from 'react';
import api from '../../api/axios';

const AnswerSheetUpload = () => {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [extractedText, setExtractedText] = useState('');
    const [pdfUrl, setPdfUrl] = useState('');
    const [history, setHistory] = useState(() => {
        const saved = localStorage.getItem('answerSheetHistory');
        return saved ? JSON.parse(saved) : [];
    });

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!file) {
            alert("Please select an image or PDF file.");
            return;
        }

        const formData = new FormData();
        formData.append('image', file); // keeping the field name 'image' as expected by multer

        try {
            setIsLoading(true);
            setMessage('Uploading File & Extracting Text...');
            setExtractedText('');
            setPdfUrl('');

            const res = await api.post('/upload/answer-sheet', formData, {
                timeout: 0,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.text) {
                setExtractedText(res.data.text);
                if (res.data.pdfUrl) {
                    setPdfUrl(res.data.pdfUrl);

                    const newItem = {
                        id: Date.now(),
                        fileName: file.name,
                        originalUrl: res.data.file,
                        pdfUrl: res.data.pdfUrl,
                        date: new Date().toLocaleString()
                    };
                    const updatedHistory = [newItem, ...history];
                    setHistory(updatedHistory);
                    localStorage.setItem('answerSheetHistory', JSON.stringify(updatedHistory));
                }
                setMessage('Text extracted and PDF generated successfully!');
            }
            setIsLoading(false);

        } catch (err) {
            console.error(err);
            setMessage('Upload Failed: ' + (err.response?.data?.message || err.message));
            setIsLoading(false);
        }
    };

    const handleDownloadPdf = () => {
        const baseUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:5001';
        window.open(`${baseUrl}${pdfUrl}`, '_blank');
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Answer Sheet to Text</h2>

            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', borderRadius: '16px', background: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <form onSubmit={handleUpload}>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Upload Answer Sheet (Image or PDF)</label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept="image/*,.pdf"
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

                {pdfUrl && !isLoading && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Generated PDF</span>
                            <button
                                onClick={handleDownloadPdf}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <i className="fa-solid fa-download" style={{ marginRight: '8px' }}></i>
                                Download PDF
                            </button>
                        </h3>
                        <div style={{ background: '#f3f4f6', padding: '0.5rem', borderRadius: '8px', height: '600px' }}>
                            <iframe
                                src={`${api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:5001'}${pdfUrl}`}
                                width="100%"
                                height="100%"
                                style={{ border: 'none', borderRadius: '4px' }}
                                title="Generated PDF"
                            />
                        </div>
                    </div>
                )}

                {/* History Section */}
                {history.length > 0 && (
                    <div style={{ marginTop: '3rem', borderTop: '1px solid #e5e7eb', paddingTop: '2rem' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>
                            <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '8px' }}></i>
                            Upload History
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {history.map((item) => (
                                <div key={item.id} style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <p style={{ fontWeight: '600', color: '#374151', margin: 0 }}>{item.fileName}</p>
                                        <small style={{ color: '#6b7280' }}>{item.date}</small>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <a
                                            href={`${api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:5001'}${item.originalUrl}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ padding: '0.5rem 1rem', background: '#f3f4f6', color: '#374151', textDecoration: 'none', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid #d1d5db', display: 'inline-flex', alignItems: 'center' }}
                                        >
                                            <i className="fa-solid fa-image" style={{ marginRight: '6px' }}></i> Original File
                                        </a>
                                        <a
                                            href={`${api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:5001'}${item.pdfUrl}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', textDecoration: 'none', borderRadius: '6px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center' }}
                                        >
                                            <i className="fa-solid fa-file-pdf" style={{ marginRight: '6px' }}></i> Generated PDF
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AnswerSheetUpload;
