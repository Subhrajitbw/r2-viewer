"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { 
  Folder, FileText, Upload, Trash2, ArrowLeft, 
  Loader2, Home, Download, RefreshCw,
  Search, Database, Settings, X, CheckCircle,
  FileVideo, FileAudio, FileCode, FileSpreadsheet, Eye, File as FileIcon
} from "lucide-react";

// --- Helper: Determine File Category ---
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

// --- Sub-Component: File Preview Modal ---
const FilePreviewModal = ({ file, isOpen, onClose }) => {
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
      // Truncate if too long for preview
      setTextContent(text.length > 50000 ? text.substring(0, 50000) + "... (Preview Truncated)" : text);
    } catch (e) {
      setTextContent("Error loading text content.");
    } finally {
      setLoadingText(false);
    }
  };

  if (!isOpen || !file) return null;

  const category = getFileCategory(file.name);

  return (
    <div className="fixed inset-0 bg-black/90 z-[150] flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/50 text-white backdrop-blur-md">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 bg-white/10 rounded-lg">
            {category === 'image' && <FileIcon size={20} />}
            {category === 'video' && <FileVideo size={20} />}
            {category === 'audio' && <FileAudio size={20} />}
            {category === 'code' && <FileCode size={20} />}
            {category === 'spreadsheet' && <FileSpreadsheet size={20} />}
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="font-medium truncate max-w-md" title={file.name}>{file.name}</h3>
            <p className="text-xs text-gray-400">{new Date(file.lastModified).toLocaleString()} • {file.size ? (file.size / 1024).toFixed(1) + ' KB' : 'Unknown'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <a 
            href={file.url} 
            download
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition text-sm font-medium"
          >
            <Download size={16} /> Download
          </a>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-white">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8" onClick={onClose}>
        <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
          
          {category === 'image' && (
            <img src={file.url} alt={file.name} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
          )}

          {category === 'video' && (
            <video controls autoPlay className="max-w-full max-h-[85vh] rounded-lg shadow-2xl outline-none bg-black">
              <source src={file.url} />
              Your browser does not support video playback.
            </video>
          )}

          {category === 'audio' && (
             <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6 min-w-[300px]">
                <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                  <FileAudio size={48} />
                </div>
                <audio controls src={file.url} className="w-full" />
             </div>
          )}

          {category === 'pdf' && (
            <iframe src={file.url} className="w-[90vw] h-[85vh] bg-white rounded-lg shadow-2xl border-none" title="PDF Preview"></iframe>
          )}

          {(category === 'code' || category === 'spreadsheet') && (
             <div className="bg-[#1e1e1e] rounded-xl shadow-2xl w-[90vw] max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-gray-700">
                <div className="bg-[#2d2d2d] px-4 py-2 text-xs text-gray-400 border-b border-gray-700 font-mono">
                  {loadingText ? 'Fetching content...' : 'Read-only Preview'}
                </div>
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                  {loadingText ? (
                    <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-500" /></div>
                  ) : (
                    <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap break-all">
                      {textContent}
                    </pre>
                  )}
                </div>
             </div>
          )}

          {category === 'other' && (
            <div className="bg-white p-10 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-md">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <FileIcon size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Preview not available</h3>
              <p className="text-gray-500 mb-6">This file type cannot be previewed directly in the browser.</p>
              <a 
                href={file.url} 
                target="_blank"
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium w-full"
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


// --- Sub-Component: Settings Modal (Existing) ---
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Settings size={20} /> Bucket Settings (CORS)
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-orange-500" /></div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-4">
                <h3 className="text-sm font-bold text-blue-800 mb-1">Fix Upload Errors</h3>
                <p className="text-xs text-blue-600 mb-3">Apply permissive policy for bulk imports/CSV.</p>
                <button 
                  onClick={applyMedusaPreset}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition flex items-center gap-1"
                >
                  <CheckCircle size={12} /> Apply Preset
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Origins</label>
                <input type="text" value={origins} onChange={(e) => setOrigins(e.target.value)} className="w-full border p-2 rounded-lg text-sm focus:ring-orange-500 focus:border-orange-500" placeholder="https://your-site.com, *" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Headers</label>
                <input type="text" value={headers} onChange={(e) => setHeaders(e.target.value)} className="w-full border p-2 rounded-lg text-sm focus:ring-orange-500 focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Methods</label>
                <div className="flex gap-4 flex-wrap">
                  {Object.keys(methods).map(m => (
                    <label key={m} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input type="checkbox" checked={methods[m]} onChange={(e) => setMethods({...methods, [m]: e.target.checked})} className="rounded text-orange-500 focus:ring-orange-500" />
                      {m}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving || loading} className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm flex items-center gap-2">
            {saving && <Loader2 className="animate-spin" size={14} />} Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Main Page Component ---
export default function R2Manager() {
  const [currentPath, setCurrentPath] = useState("");
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // New States
  const [showSettings, setShowSettings] = useState(false);
  const [previewFile, setPreviewFile] = useState(null); // For the preview modal
  const [searchQuery, setSearchQuery] = useState("");
  const [sortValue, setSortValue] = useState("time-desc"); 

  useEffect(() => {
    fetchContent();
  }, [currentPath]);

  const fetchContent = async () => {
    setLoading(true);
    setSearchQuery(""); 
    try {
      const { data } = await axios.get(`/api/storage?prefix=${encodeURIComponent(currentPath)}`);
      setFolders(data.folders);
      setFiles(data.files);
    } catch (error) {
      console.error(error);
      alert("Error loading files");
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

  const storageStats = useMemo(() => {
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    return { count: files.length, size: totalSize };
  }, [files]);

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
      fetchContent();
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (key) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    try {
      await axios.delete(`/api/storage?key=${encodeURIComponent(key)}`);
      fetchContent();
    } catch (error) {
      alert("Delete failed");
    }
  };

  const navigateUp = () => {
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    setCurrentPath(parts.length > 0 ? parts.join("/") + "/" : "");
  };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) uploadFile(e.dataTransfer.files[0]);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto">
        
        {/* Modals */}
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        <FilePreviewModal file={previewFile} isOpen={!!previewFile} onClose={() => setPreviewFile(null)} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="bg-orange-500 text-white p-1 rounded">R2</span> Storage
            </h1>
            <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
              <Database size={14} />
              <span>{storageStats.count} items</span>
              <span>•</span>
              <span>{formatSize(storageStats.size)} in current folder</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
             <div className="relative group flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 w-full sm:w-64 transition"
              />
            </div>

            <button onClick={() => setShowSettings(true)} className="p-2 text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg transition" title="Settings">
              <Settings size={20} />
            </button>

            <button onClick={fetchContent} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition border border-gray-200 bg-white" title="Refresh">
              <RefreshCw size={20} />
            </button>

            <label className={`
              flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg cursor-pointer hover:bg-gray-800 transition shadow-sm
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}>
              {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
              <span className="hidden sm:inline">{uploading ? 'Uploading...' : 'Upload'}</span>
              <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* Main Card */}
        <div 
          className={`bg-white rounded-xl shadow-sm border transition-colors duration-200 min-h-[600px] flex flex-col
            ${dragActive ? 'border-orange-500 ring-4 ring-orange-500/10' : 'border-gray-200'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {/* Breadcrumbs & Sorting */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-2 border-b border-gray-100 bg-gray-50/50 rounded-t-xl gap-2">
            <div className="flex items-center gap-1 overflow-x-auto p-2 no-scrollbar">
              <button 
                onClick={() => setCurrentPath("")}
                className={`p-1.5 rounded-md hover:bg-gray-200 text-gray-500 ${currentPath === "" ? 'text-gray-900 bg-gray-200' : ''}`}
              >
                <Home size={18} />
              </button>
              
              {currentPath && (
                <>
                  <span className="text-gray-300">/</span>
                  <button onClick={navigateUp} className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500">
                    <ArrowLeft size={18} />
                  </button>
                  {currentPath.split('/').filter(Boolean).map((part, i, arr) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="text-gray-300">/</span>
                      <button 
                          onClick={() => {
                            const newPath = arr.slice(0, i + 1).join('/') + '/';
                            setCurrentPath(newPath);
                          }}
                          className="font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 px-2 py-0.5 rounded transition whitespace-nowrap text-sm"
                      >
                        {part}
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="flex items-center gap-2 p-2 border-t md:border-t-0 border-gray-100">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:block">Sort by:</span>
              <select 
                value={sortValue}
                onChange={(e) => setSortValue(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 text-sm rounded-md focus:ring-orange-500 focus:border-orange-500 block p-1.5 outline-none cursor-pointer"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="time-desc">Date (Newest First)</option>
                <option value="time-asc">Date (Oldest First)</option>
                <option value="size-desc">Size (Largest First)</option>
                <option value="size-asc">Size (Smallest First)</option>
              </select>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 flex-1">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-orange-500" />
                <p>Loading bucket contents...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                
                {/* Folders */}
                {processedContent.folders.map((folder) => (
                  <div 
                    key={folder.name}
                    onClick={() => setCurrentPath(folder.name)}
                    className="group cursor-pointer p-4 rounded-xl bg-gray-50 border border-transparent hover:border-orange-200 hover:bg-orange-50 transition flex flex-col items-center text-center relative"
                  >
                    <Folder className="w-14 h-14 text-yellow-400 fill-yellow-100 mb-2 drop-shadow-sm transform group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm font-medium text-gray-700 truncate w-full select-none">
                      {folder.displayName}
                    </span>
                  </div>
                ))}

                {/* Files */}
                {processedContent.files.map((file) => {
                  const category = getFileCategory(file.name);
                  return (
                    <div key={file.key} className="group relative bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-orange-200 transition-all duration-200 overflow-hidden flex flex-col">
                      
                      {/* Thumbnail / Icon Area */}
                      <div 
                        className="aspect-square bg-gray-100 relative overflow-hidden flex items-center justify-center cursor-pointer"
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
                          <div className="flex flex-col items-center text-gray-400">
                             {/* Dynamic Icons based on type */}
                             {category === 'video' && <FileVideo size={48} className="mb-2 text-blue-400" />}
                             {category === 'audio' && <FileAudio size={48} className="mb-2 text-purple-400" />}
                             {category === 'code' && <FileCode size={48} className="mb-2 text-green-400" />}
                             {category === 'spreadsheet' && <FileSpreadsheet size={48} className="mb-2 text-green-600" />}
                             {category === 'pdf' && <FileText size={48} className="mb-2 text-red-500" />}
                             {category === 'other' && <FileText size={48} className="mb-2" />}
                            
                            <span className="text-[10px] uppercase font-bold bg-gray-200 px-2 py-1 rounded text-gray-500">{file.type || category}</span>
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                            className="p-2 bg-white text-gray-900 rounded-full hover:scale-110 hover:bg-orange-500 hover:text-white transition shadow-lg"
                            title="Preview"
                          >
                            <Eye size={16} />
                          </button>
                          <a 
                            href={file.url} 
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 bg-white text-gray-900 rounded-full hover:scale-110 hover:bg-blue-500 hover:text-white transition shadow-lg"
                            title="Download"
                          >
                            <Download size={16} />
                          </a>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(file.key); }}
                            className="p-2 bg-white text-red-600 rounded-full hover:scale-110 hover:bg-red-600 hover:text-white transition shadow-lg"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-white flex-1 flex flex-col justify-center">
                        <p className="text-sm font-medium text-gray-800 truncate mb-1" title={file.name}>
                          {file.name}
                        </p>
                        <div className="flex justify-between items-end text-[10px] text-gray-400 uppercase tracking-wide font-semibold">
                          <span>{formatSize(file.size)}</span>
                          <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!processedContent.folders.length && !processedContent.files.length && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                     {searchQuery ? (
                       <>
                        <Search className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-medium text-gray-500">No results found</p>
                       </>
                    ) : (
                       <>
                        <Upload className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-medium text-gray-500">No files found</p>
                       </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {dragActive && (
            <div className="absolute inset-0 bg-orange-500/10 backdrop-blur-sm rounded-xl flex items-center justify-center z-50 border-2 border-orange-500 border-dashed m-2 pointer-events-none">
              <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center animate-bounce">
                <Upload className="w-12 h-12 text-orange-500 mb-2" />
                <p className="text-lg font-bold text-orange-600">Drop file to upload</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}