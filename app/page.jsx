"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { 
  Folder, FileText, Upload, Trash2, ArrowLeft, 
  Loader2, Home, Download, RefreshCw,
  Search, Database, Settings, X, CheckCircle,
  FileVideo, FileAudio, FileCode, FileSpreadsheet, Eye, File as FileIcon,
  Link2, Check, Copy, FolderOpen, HardDrive, TrendingUp, Filter, Grid, List,
  MoreVertical, Info
} from "lucide-react";

// --- Helper Functions ---
const getFileCategory = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['txt', 'md', 'json', 'js', 'css', 'html', 'xml', 'log', 'env'].includes(ext)) return 'code';
  if (['csv', 'xls', 'xlsx'].includes(ext)) return 'spreadsheet';
  return 'other';
};

const getFileUrl = (originalUrl) => {
  const customDomain = process.env.NEXT_PUBLIC_R2_CUSTOM_DOMAIN;
  if (!customDomain) return originalUrl;
  try {
    const url = new URL(originalUrl);
    let cleanPath = url.pathname;
    const pathParts = cleanPath.split('/').filter(Boolean);
    if (pathParts.length > 0 && pathParts[0] === 'aroha') {
      pathParts.shift();
      cleanPath = '/' + pathParts.join('/');
    }
    const domain = customDomain.endsWith('/') ? customDomain.slice(0, -1) : customDomain;
    return `${domain}${cleanPath}`;
  } catch (e) {
    return originalUrl;
  }
};

const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// --- Toast Component ---
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[200] animate-in slide-in-from-bottom-5">
      <div className={`
        flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-xl border-2
        ${type === 'success' 
          ? 'bg-emerald-500 border-emerald-400 text-white' 
          : 'bg-rose-500 border-rose-400 text-white'}
      `}>
        {type === 'success' ? <CheckCircle size={22} strokeWidth={2.5} /> : <X size={22} strokeWidth={2.5} />}
        <span className="font-semibold">{message}</span>
      </div>
    </div>
  );
};

// --- File Preview Modal ---
const FilePreviewModal = ({ file, isOpen, onClose, onCopyLink }) => {
  const [textContent, setTextContent] = useState(null);
  const [loadingText, setLoadingText] = useState(false);

  useEffect(() => {
    if (isOpen && file && (getFileCategory(file.name) === 'code' || getFileCategory(file.name) === 'spreadsheet')) {
      fetchTextContent();
    } else {
      setTextContent(null);
    }
  }, [file, isOpen]);

  const fetchTextContent = async () => {
    setLoadingText(true);
    try {
      const res = await fetch(file.url);
      const text = await res.text();
      setTextContent(text.length > 50000 ? text.substring(0, 50000) + "\n\n... (Preview Truncated)" : text);
    } catch (e) {
      setTextContent("Error loading text content.");
    } finally {
      setLoadingText(false);
    }
  };

  if (!isOpen || !file) return null;

  const category = getFileCategory(file.name);
  const displayUrl = getFileUrl(file.url);

  return (
    <div className="fixed inset-0 bg-black/95 z-[150] flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-gradient-to-b from-black/80 to-transparent text-white backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-4 overflow-hidden flex-1">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
            {category === 'image' && <FileIcon size={24} />}
            {category === 'video' && <FileVideo size={24} />}
            {category === 'audio' && <FileAudio size={24} />}
            {category === 'code' && <FileCode size={24} />}
            {category === 'spreadsheet' && <FileSpreadsheet size={24} />}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="font-semibold text-lg truncate" title={file.name}>{file.name}</h3>
            <p className="text-sm text-white/60">
              {new Date(file.lastModified).toLocaleString()} • {formatSize(file.size)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onCopyLink(displayUrl)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Link2 size={18} /> Copy Link
          </button>
          <a 
            href={displayUrl} 
            download
            target="_blank"
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-100 text-gray-900 rounded-xl transition font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Download size={18} /> Download
          </a>
          <button 
            onClick={onClose} 
            className="p-2.5 hover:bg-white/10 rounded-xl transition"
          >
            <X size={26} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-8" onClick={onClose}>
        <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
          {category === 'image' && (
            <img src={file.url} alt={file.name} className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
          )}
          {category === 'video' && (
            <video controls autoPlay className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl outline-none bg-black">
              <source src={file.url} />
            </video>
          )}
          {category === 'audio' && (
            <div className="bg-white p-10 rounded-2xl shadow-2xl flex flex-col items-center gap-6 min-w-[350px]">
              <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white shadow-xl">
                <FileAudio size={56} />
              </div>
              <audio controls src={file.url} className="w-full" />
            </div>
          )}
          {category === 'pdf' && (
            <iframe src={file.url} className="w-[90vw] h-[85vh] bg-white rounded-2xl shadow-2xl border-none" title="PDF Preview" />
          )}
          {(category === 'code' || category === 'spreadsheet') && (
            <div className="bg-[#1e1e1e] rounded-2xl shadow-2xl w-[90vw] max-w-6xl h-[85vh] flex flex-col overflow-hidden border border-gray-700">
              <div className="bg-[#2d2d2d] px-6 py-3 text-sm text-gray-400 border-b border-gray-700 font-mono flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="ml-4">{loadingText ? 'Fetching content...' : file.name}</span>
              </div>
              <div className="flex-1 overflow-auto p-6">
                {loadingText ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-gray-500" size={32} />
                  </div>
                ) : (
                  <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
                    {textContent}
                  </pre>
                )}
              </div>
            </div>
          )}
          {category === 'other' && (
            <div className="bg-white p-12 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-md">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6 text-gray-400">
                <FileIcon size={48} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Preview unavailable</h3>
              <p className="text-gray-500 mb-8">This file type cannot be previewed in the browser.</p>
              <a 
                href={displayUrl} 
                target="_blank"
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition font-semibold w-full shadow-lg"
              >
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Settings Modal ---
const SettingsModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [origins, setOrigins] = useState("*");
  const [headers, setHeaders] = useState("*");
  const [methods, setMethods] = useState({
    GET: true, PUT: true, POST: true, DELETE: true, HEAD: true
  });

  useEffect(() => {
    if (isOpen) fetchSettings();
  }, [isOpen]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/settings");
      if (data.rules && data.rules.length > 0) {
        const rule = data.rules[0];
        setOrigins(rule.AllowedOrigins?.join(", ") || "*");
        setHeaders(rule.AllowedHeaders?.join(", ") || "*");
        const newMethods = { GET: false, PUT: false, POST: false, DELETE: false, HEAD: false };
        rule.AllowedMethods?.forEach(m => newMethods[m] = true);
        setMethods(newMethods);
      }
    } catch (error) {
      console.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const selectedMethods = Object.keys(methods).filter(k => methods[k]);
      const rule = {
        AllowedOrigins: origins.split(",").map(s => s.trim()),
        AllowedMethods: selectedMethods,
        AllowedHeaders: headers.split(",").map(s => s.trim()),
        ExposeHeaders: ["ETag", "Content-Length", "Content-Type"],
        MaxAgeSeconds: 3600
      };
      await axios.post("/api/settings", { rules: [rule] });
      alert("Settings saved! Please wait 1-2 minutes for propagation.");
      onClose();
    } catch (error) {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const applyMedusaPreset = () => {
    setOrigins("*");
    setHeaders("*");
    setMethods({ GET: true, PUT: true, POST: true, DELETE: true, HEAD: true });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Settings size={22} className="text-orange-600" />
            </div>
            <h2 className="font-bold text-xl text-gray-800">Bucket Settings (CORS)</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <X size={22} />
          </button>
        </div>
        
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="animate-spin text-orange-500" size={40} />
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 p-5 rounded-xl">
                <div className="flex items-start gap-3 mb-4">
                  <Info className="text-blue-600 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-bold text-blue-900 mb-1">Quick Fix for Upload Errors</h3>
                    <p className="text-sm text-blue-700">Apply permissive CORS policy for Medusa bulk imports and CSV operations.</p>
                  </div>
                </div>
                <button 
                  onClick={applyMedusaPreset}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition font-semibold flex items-center gap-2 shadow-lg"
                >
                  <CheckCircle size={18} /> Apply Recommended Preset
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Allowed Origins</label>
                <input 
                  type="text" 
                  value={origins} 
                  onChange={(e) => setOrigins(e.target.value)} 
                  className="w-full border-2 border-gray-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition" 
                  placeholder="https://your-site.com, *" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Allowed Headers</label>
                <input 
                  type="text" 
                  value={headers} 
                  onChange={(e) => setHeaders(e.target.value)} 
                  className="w-full border-2 border-gray-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Allowed Methods</label>
                <div className="flex gap-4 flex-wrap">
                  {Object.keys(methods).map(m => (
                    <label key={m} className="flex items-center gap-2 text-sm cursor-pointer select-none bg-gray-50 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition">
                      <input 
                        type="checkbox" 
                        checked={methods[m]} 
                        onChange={(e) => setMethods({...methods, [m]: e.target.checked})} 
                        className="rounded-md text-orange-500 focus:ring-orange-500 w-5 h-5" 
                      />
                      <span className="font-medium">{m}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving || loading} 
            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 font-semibold flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving && <Loader2 className="animate-spin" size={16} />} 
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
export default function R2Manager() {
  const [currentPath, setCurrentPath] = useState("");
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [allFiles, setAllFiles] = useState([]); // NEW: Store all files for total stats
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortValue, setSortValue] = useState("time-desc");
  const [toast, setToast] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  // NEW: Fetch total stats on mount
  useEffect(() => {
    fetchTotalStats();
  }, []);

  useEffect(() => {
    fetchContent();
  }, [currentPath]);

  const fetchTotalStats = async () => {
  try {
    // NEW: Pass includeAll=true to get ALL files
    const { data } = await axios.get(`/api/storage?includeAll=true`);
    setAllFiles(data.files || []);
  } catch (error) {
    console.error("Failed to fetch total stats");
  }
};
  const fetchContent = async () => {
    setLoading(true);
    setSearchQuery("");
    try {
      const { data } = await axios.get(`/api/storage?prefix=${encodeURIComponent(currentPath)}`);
      setFolders(data.folders || []);
      setFiles(data.files || []);
    } catch (error) {
      console.error(error);
      setToast({ message: 'Error loading files', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const processedContent = useMemo(() => {
    let filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    let filteredFolders = folders.filter(f => f.displayName.toLowerCase().includes(searchQuery.toLowerCase()));

    const [key, direction] = sortValue.split("-");
    const sortFn = (a, b) => {
      let valA, valB;
      switch (key) {
        case 'size': valA = a.size || 0; valB = b.size || 0; break;
        case 'time': valA = new Date(a.lastModified || 0).getTime(); valB = new Date(b.lastModified || 0).getTime(); break;
        case 'name': default: valA = a.name || a.displayName; valB = b.name || b.displayName; break;
      }
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    };

    return { 
      folders: filteredFolders.sort(sortFn), 
      files: filteredFiles.sort(sortFn) 
    };
  }, [files, folders, searchQuery, sortValue]);

  // NEW: Calculate both current folder and total storage stats
  const storageStats = useMemo(() => {
    const currentSize = processedContent.files.reduce((acc, file) => acc + (file.size || 0), 0);
    const totalSize = allFiles.reduce((acc, file) => acc + (file.size || 0), 0);
    return { 
      currentCount: processedContent.files.length,
      currentSize,
      totalCount: allFiles.length, 
      totalSize
    };
  }, [processedContent.files, allFiles]);

  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setToast({ message: 'Link copied to clipboard!', type: 'success' });
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setToast({ message: 'Link copied to clipboard!', type: 'success' });
      }
    } catch (err) {
      setToast({ message: 'Failed to copy link', type: 'error' });
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const uploadFile = async (file) => {
    setUploading(true);
    try {
      const filename = `${currentPath}${file.name}`;
      const { data } = await axios.post("/api/storage", { filename, contentType: file.type });
      await axios.put(data.url, file, { headers: { "Content-Type": file.type } });
      await fetchContent();
      await fetchTotalStats();
      setToast({ message: 'File uploaded successfully!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Upload failed', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (key) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    try {
      await axios.delete(`/api/storage?key=${encodeURIComponent(key)}`);
      await fetchContent();
      await fetchTotalStats();
      setToast({ message: 'File deleted successfully', type: 'success' });
    } catch (error) {
      setToast({ message: 'Delete failed', type: 'error' });
    }
  };

  const navigateUp = () => {
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    setCurrentPath(parts.length > 0 ? parts.join("/") + "/" : "");
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) uploadFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-50 p-4 sm:p-8">
      <div className="max-w-[1800px] mx-auto">
        
        {/* Modals & Toast */}
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        <FilePreviewModal 
          file={previewFile} 
          isOpen={!!previewFile} 
          onClose={() => setPreviewFile(null)}
          onCopyLink={copyToClipboard}
        />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* Header with Stats Cards */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg">
                  <HardDrive size={32} />
                </div>
                R2 Storage Manager
              </h1>
              <p className="text-gray-500 text-lg">Manage your Cloudflare R2 bucket files</p>
            </div>

            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
              <div className="relative group flex-1 lg:flex-none min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition" size={20} />
                <input 
                  type="text" 
                  placeholder="Search files and folders..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 w-full transition bg-white shadow-sm"
                />
              </div>

              <button 
                onClick={() => setShowSettings(true)} 
                className="p-3 text-gray-600 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl transition shadow-sm" 
                title="Settings"
              >
                <Settings size={22} />
              </button>

              <button 
                onClick={fetchContent} 
                className="p-3 text-gray-600 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl transition shadow-sm" 
                title="Refresh"
              >
                <RefreshCw size={22} />
              </button>

              <label className={`
                flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl cursor-pointer hover:from-orange-600 hover:to-orange-700 transition shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold
                ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
              `}>
                {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
                <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Database size={24} className="text-blue-600" />
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Storage</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatSize(storageStats.totalSize)}</p>
              <p className="text-sm text-gray-500 mt-1">{storageStats.totalCount} total files</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <FolderOpen size={24} className="text-green-600" />
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Folder</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatSize(storageStats.currentSize)}</p>
              <p className="text-sm text-gray-500 mt-1">{storageStats.currentCount} files</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Folder size={24} className="text-purple-600" />
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Folders</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{folders.length}</p>
              <p className="text-sm text-gray-500 mt-1">In current location</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <TrendingUp size={24} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">Usage</span>
              </div>
              <p className="text-3xl font-bold">
                {storageStats.totalSize > 0 ? Math.round((storageStats.totalSize / (1024 * 1024 * 1024)) * 100) / 100 : 0} GB
              </p>
              <p className="text-sm opacity-90 mt-1">Space used</p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div 
          className={`bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 min-h-[600px] flex flex-col overflow-hidden
            ${dragActive ? 'border-orange-500 ring-4 ring-orange-500/20 scale-[1.02]' : 'border-gray-200'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {/* Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between p-5 border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white gap-4">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
              <button 
                onClick={() => setCurrentPath("")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition font-medium ${currentPath === "" ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <Home size={18} />
                <span className="hidden sm:inline">Home</span>
              </button>
              
              {currentPath && (
                <>
                  <span className="text-gray-300">/</span>
                  {currentPath !== "" && (
                    <button 
                      onClick={navigateUp} 
                      className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-600"
                      title="Go up"
                    >
                      <ArrowLeft size={18} />
                    </button>
                  )}
                  {currentPath.split('/').filter(Boolean).map((part, i, arr) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-gray-300">/</span>
                      <button 
                        onClick={() => {
                          const newPath = arr.slice(0, i + 1).join('/') + '/';
                          setCurrentPath(newPath);
                        }}
                        className="px-4 py-2 font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition whitespace-nowrap"
                      >
                        {part}
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition ${viewMode === "grid" ? 'bg-white shadow-sm text-orange-600' : 'text-gray-600 hover:text-gray-900'}`}
                  title="Grid view"
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition ${viewMode === "list" ? 'bg-white shadow-sm text-orange-600' : 'text-gray-600 hover:text-gray-900'}`}
                  title="List view"
                >
                  <List size={18} />
                </button>
              </div>

              <select 
                value={sortValue}
                onChange={(e) => setSortValue(e.target.value)}
                className="bg-white border-2 border-gray-200 text-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 px-4 py-2 outline-none cursor-pointer font-medium"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="time-desc">Newest First</option>
                <option value="time-asc">Oldest First</option>
                <option value="size-desc">Largest First</option>
                <option value="size-asc">Smallest First</option>
              </select>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 flex-1 overflow-auto">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center">
                <Loader2 className="w-16 h-16 animate-spin mb-4 text-orange-500" />
                <p className="text-gray-500 font-medium">Loading bucket contents...</p>
              </div>
            ) : (
              <div className={viewMode === "grid" 
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" 
                : "space-y-2"
              }>
                
                {/* Folders */}
                {processedContent.folders.map((folder) => (
                  viewMode === "grid" ? (
                    <div 
                      key={folder.name}
                      onClick={() => setCurrentPath(folder.name)}
                      className="group cursor-pointer p-5 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-transparent hover:border-orange-300 hover:shadow-lg transition-all transform hover:scale-105 flex flex-col items-center text-center"
                    >
                      <Folder className="w-16 h-16 text-amber-500 mb-3 drop-shadow-sm transform group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                      <span className="text-sm font-semibold text-gray-800 truncate w-full">
                        {folder.displayName}
                      </span>
                    </div>
                  ) : (
                    <div
                      key={folder.name}
                      onClick={() => setCurrentPath(folder.name)}
                      className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition group border border-transparent hover:border-gray-200"
                    >
                      <Folder className="w-8 h-8 text-amber-500" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{folder.displayName}</p>
                        <p className="text-sm text-gray-500">Folder</p>
                      </div>
                    </div>
                  )
                ))}

                {/* Files */}
                {processedContent.files.map((file) => {
                  const category = getFileCategory(file.name);
                  const displayUrl = getFileUrl(file.url);
                  
                  return viewMode === "grid" ? (
                    <div key={file.key} className="group relative bg-white border-2 border-gray-200 rounded-2xl hover:shadow-xl hover:border-orange-300 transition-all duration-300 overflow-hidden flex flex-col">
                      
                      {/* Thumbnail */}
                      <div 
                        className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden flex items-center justify-center cursor-pointer"
                        onClick={() => setPreviewFile(file)}
                      >
                        {category === 'image' ? (
                          <img 
                            src={file.url} 
                            alt={file.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-gray-400 p-4">
                            {category === 'video' && <FileVideo size={48} className="mb-2 text-blue-500" strokeWidth={1.5} />}
                            {category === 'audio' && <FileAudio size={48} className="mb-2 text-purple-500" strokeWidth={1.5} />}
                            {category === 'code' && <FileCode size={48} className="mb-2 text-green-500" strokeWidth={1.5} />}
                            {category === 'spreadsheet' && <FileSpreadsheet size={48} className="mb-2 text-emerald-500" strokeWidth={1.5} />}
                            {category === 'pdf' && <FileText size={48} className="mb-2 text-red-500" strokeWidth={1.5} />}
                            {category === 'other' && <FileText size={48} className="mb-2" strokeWidth={1.5} />}
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                            className="p-3 bg-white/90 backdrop-blur-sm text-gray-900 rounded-xl hover:bg-white transition shadow-lg transform hover:scale-110"
                            title="Preview"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(displayUrl); }}
                            className="p-3 bg-white/90 backdrop-blur-sm text-gray-900 rounded-xl hover:bg-white transition shadow-lg transform hover:scale-110"
                            title="Copy Link"
                          >
                            <Copy size={18} />
                          </button>
                          <a 
                            href={displayUrl} 
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-3 bg-white/90 backdrop-blur-sm text-gray-900 rounded-xl hover:bg-white transition shadow-lg transform hover:scale-110"
                            title="Download"
                          >
                            <Download size={18} />
                          </a>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(file.key); }}
                            className="p-3 bg-red-500/90 backdrop-blur-sm text-white rounded-xl hover:bg-red-600 transition shadow-lg transform hover:scale-110"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* File Info */}
                      <div className="p-4 bg-white">
                        <p className="text-sm font-semibold text-gray-800 truncate mb-2" title={file.name}>
                          {file.name}
                        </p>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span className="font-medium">{formatSize(file.size)}</span>
                          <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={file.key} className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition group border border-transparent hover:border-gray-200">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                        {category === 'image' && <FileIcon size={24} className="text-gray-600" />}
                        {category === 'video' && <FileVideo size={24} className="text-blue-500" />}
                        {category === 'audio' && <FileAudio size={24} className="text-purple-500" />}
                        {category === 'code' && <FileCode size={24} className="text-green-500" />}
                        {category === 'spreadsheet' && <FileSpreadsheet size={24} className="text-emerald-500" />}
                        {category === 'pdf' && <FileText size={24} className="text-red-500" />}
                        {category === 'other' && <FileText size={24} className="text-gray-500" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{file.name}</p>
                        <p className="text-sm text-gray-500">{formatSize(file.size)} • {new Date(file.lastModified).toLocaleDateString()}</p>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button 
                          onClick={() => setPreviewFile(file)}
                          className="p-2 hover:bg-gray-200 rounded-lg transition"
                          title="Preview"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => copyToClipboard(displayUrl)}
                          className="p-2 hover:bg-gray-200 rounded-lg transition"
                          title="Copy Link"
                        >
                          <Copy size={18} />
                        </button>
                        <a 
                          href={displayUrl} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-gray-200 rounded-lg transition"
                          title="Download"
                        >
                          <Download size={18} />
                        </a>
                        <button 
                          onClick={() => handleDelete(file.key)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Empty State */}
                {!processedContent.folders.length && !processedContent.files.length && (
                  <div className="col-span-full py-24 flex flex-col items-center justify-center">
                    {searchQuery ? (
                      <>
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                          <Search className="w-12 h-12 text-gray-400" />
                        </div>
                        <p className="text-xl font-semibold text-gray-700 mb-2">No results found</p>
                        <p className="text-gray-500">Try adjusting your search query</p>
                      </>
                    ) : (
                      <>
                        <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mb-6">
                          <Upload className="w-12 h-12 text-orange-600" />
                        </div>
                        <p className="text-xl font-semibold text-gray-700 mb-2">This folder is empty</p>
                        <p className="text-gray-500 mb-6">Drag and drop files here or click the upload button</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Drag & Drop Overlay */}
          {dragActive && (
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-md flex items-center justify-center z-50 border-4 border-orange-500 border-dashed m-4 rounded-2xl">
              <div className="bg-white p-10 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-10 h-10 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900">Drop your file here</p>
                <p className="text-gray-500 mt-2">Release to upload</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
