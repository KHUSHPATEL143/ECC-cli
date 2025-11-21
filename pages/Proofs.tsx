
import React, { useState } from 'react';
import { UploadCloud, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/Loader';

export const Proofs: React.FC = () => {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        fileName: '',
        fileType: 'Monthly Contribution'
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus(null);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !user?.email) return;
        
        setLoading(true);
        setStatus(null);

        try {
            // Convert file to Base64
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Data = (reader.result as string).split(',')[1];
                
                const res = await api.uploadFile({
                    fileName: formData.fileName || file.name,
                    fileType: formData.fileType,
                    mimeType: file.type,
                    data: base64Data,
                    uploadedBy: user.email
                });

                if (res.status === 'success') {
                    setStatus({ type: 'success', msg: 'Proof uploaded successfully!' });
                    setFile(null);
                    setFormData({ fileName: '', fileType: 'Monthly Contribution' });
                } else {
                    setStatus({ type: 'error', msg: res.message || 'Upload failed' });
                }
                setLoading(false);
            };
            reader.onerror = () => {
                setStatus({ type: 'error', msg: 'Error reading file' });
                setLoading(false);
            };
        } catch (err) {
            setStatus({ type: 'error', msg: 'Network error during upload' });
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-navy-800 p-6 rounded-2xl border border-gold-600/20 shadow-luxury">
                <h2 className="font-heading text-2xl font-bold text-gold-500 mb-6">Upload Proof</h2>
                <form onSubmit={handleUpload} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs text-gold-400 mb-2 uppercase tracking-wider">Proof Type</label>
                            <select 
                                value={formData.fileType}
                                onChange={e => setFormData({...formData, fileType: e.target.value})}
                                className="w-full bg-navy-900 border border-gold-600/30 text-cream p-3 rounded focus:outline-none focus:border-gold-400"
                            >
                                <option>Monthly Contribution</option>
                                <option>One-time Investment</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gold-400 mb-2 uppercase tracking-wider">File Name (Optional)</label>
                            <input 
                                type="text" 
                                value={formData.fileName}
                                onChange={e => setFormData({...formData, fileName: e.target.value})}
                                placeholder="e.g., April Payment"
                                className="w-full bg-navy-900 border border-gold-600/30 text-cream p-3 rounded focus:outline-none focus:border-gold-400" 
                            />
                        </div>
                    </div>

                    <div className="relative border-2 border-dashed border-gold-600/30 rounded-xl p-8 flex flex-col items-center justify-center hover:bg-gold-600/5 transition-colors cursor-pointer group">
                        <input 
                            type="file" 
                            accept="image/*,application/pdf"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={handleFileChange}
                        />
                        <UploadCloud className={`mb-4 transition-colors ${file ? 'text-success' : 'text-gold-500 group-hover:text-gold-400'}`} size={48} />
                        <p className="text-cream font-medium text-center">
                            {file ? file.name : 'Click or Drag file to upload'}
                        </p>
                        <p className="text-subtext text-xs mt-2">Supports JPG, PNG, PDF (Max 5MB)</p>
                        {file && (
                            <button 
                                type="button" 
                                onClick={(e) => { e.preventDefault(); setFile(null); }}
                                className="mt-4 text-error text-xs hover:underline z-20 relative"
                            >
                                Remove File
                            </button>
                        )}
                    </div>

                    {status && (
                        <div className={`p-3 rounded flex items-center gap-2 text-sm ${status.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                            {status.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                            {status.msg}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={loading || !file}
                        className="btn-gold w-full py-3 bg-gold-600 text-navy-900 font-bold uppercase tracking-widest rounded hover:bg-gold-500 transition-colors shadow-gold-glow disabled:opacity-50 disabled:shadow-none flex justify-center"
                    >
                        {loading ? <Loader /> : 'Upload Document'}
                    </button>
                </form>
            </div>
        </div>
    );
};
