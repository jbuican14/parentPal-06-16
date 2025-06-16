import React, { useState } from 'react';
import { RefreshCw, Copy, Check, Zap } from 'lucide-react';

interface PasswordGeneratorProps {
  onPasswordGenerated: (password: string) => void;
  className?: string;
}

const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({ onPasswordGenerated, className = '' }) => {
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [options, setOptions] = useState({
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: true
  });
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const generatePassword = () => {
    let charset = '';
    
    if (options.includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (options.includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.includeNumbers) charset += '0123456789';
    if (options.includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (options.excludeSimilar) {
      charset = charset.replace(/[il1Lo0O]/g, '');
    }

    if (!charset) {
      alert('Please select at least one character type');
      return;
    }

    let password = '';
    for (let i = 0; i < options.length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    setGeneratedPassword(password);
    setCopied(false);
  };

  const copyToClipboard = async () => {
    if (!generatedPassword) return;
    
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  const usePassword = () => {
    if (generatedPassword) {
      onPasswordGenerated(generatedPassword);
      setGeneratedPassword('');
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;
    
    if (score <= 2) return { strength: score * 16, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { strength: score * 16, label: 'Fair', color: 'bg-yellow-500' };
    if (score <= 4) return { strength: score * 16, label: 'Good', color: 'bg-blue-500' };
    if (score <= 5) return { strength: score * 16, label: 'Strong', color: 'bg-green-500' };
    return { strength: 100, label: 'Very Strong', color: 'bg-green-600' };
  };

  const passwordStrength = getPasswordStrength(generatedPassword);

  return (
    <div className={`bg-gray-50 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Zap className="w-4 h-4 text-indigo-600 mr-2" />
          <h3 className="font-medium text-gray-900">Password Generator</h3>
        </div>
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          {showOptions ? 'Hide Options' : 'Options'}
        </button>
      </div>

      {showOptions && (
        <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Length: {options.length}
              </label>
              <input
                type="range"
                min="8"
                max="32"
                value={options.length}
                onChange={(e) => setOptions(prev => ({ ...prev, length: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.includeUppercase}
                onChange={(e) => setOptions(prev => ({ ...prev, includeUppercase: e.target.checked }))}
                className="mr-2 rounded"
              />
              Uppercase (A-Z)
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.includeLowercase}
                onChange={(e) => setOptions(prev => ({ ...prev, includeLowercase: e.target.checked }))}
                className="mr-2 rounded"
              />
              Lowercase (a-z)
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.includeNumbers}
                onChange={(e) => setOptions(prev => ({ ...prev, includeNumbers: e.target.checked }))}
                className="mr-2 rounded"
              />
              Numbers (0-9)
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.includeSymbols}
                onChange={(e) => setOptions(prev => ({ ...prev, includeSymbols: e.target.checked }))}
                className="mr-2 rounded"
              />
              Symbols (!@#$)
            </label>
            <label className="flex items-center col-span-2">
              <input
                type="checkbox"
                checked={options.excludeSimilar}
                onChange={(e) => setOptions(prev => ({ ...prev, excludeSimilar: e.target.checked }))}
                className="mr-2 rounded"
              />
              Exclude similar characters (i, l, 1, L, o, 0, O)
            </label>
          </div>
        </div>
      )}

      <div className="flex space-x-2 mb-3">
        <button
          onClick={generatePassword}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Generate
        </button>
      </div>

      {generatedPassword && (
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">Generated Password:</span>
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-600">{passwordStrength.label}</span>
                <div className="w-12 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${passwordStrength.strength}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="font-mono text-sm bg-gray-50 p-2 rounded border break-all">
              {generatedPassword}
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={copyToClipboard}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={usePassword}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
            >
              Use Password
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordGenerator;