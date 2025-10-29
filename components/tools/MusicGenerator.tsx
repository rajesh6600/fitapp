
'use client';

import { useState } from 'react';
import { Music, Download, Play, Pause, AlertCircle, Info } from 'lucide-react';

export const MusicGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(30);
  const [audioUrl, setAudioUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [mockMode, setMockMode] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a music description');
      return;
    }

    setIsLoading(true);
    setError('');
    setAudioUrl('');
    setMockMode(false);

    try {
      const response = await fetch('/api/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          duration: duration
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to generate music');
      }

      setAudioUrl(data.url);
      setMockMode(data.mock || false);
    } catch (error) {
      console.error('Generation error:', error);
      setError(error instanceof Error ? error.message : 'Unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioPlay = () => setIsPlaying(true);
  const handleAudioPause = () => setIsPlaying(false);

  return (
    <div className="wellness-card p-6">
      <div className="flex items-center mb-6">
        <div className="p-3 rounded-lg bg-purple-500 mr-4">
          <Music className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">AI Music Generator</h3>
          <p className="text-muted-foreground">Create custom music with AI</p>
        </div>
      </div>


      <div className="space-y-4">
        {/* Prompt Input */}
        <div>
          <label htmlFor="music-prompt" className="block text-sm font-medium text-foreground mb-2">
            Describe your music
          </label>
          <textarea
            id="music-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., relaxing yoga music with nature sounds, upbeat workout track, peaceful meditation ambience..."
            className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            rows={3}
            disabled={isLoading}
          />
        </div>



        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim()}
          className="wellness-button bg-purple-500 hover:bg-purple-600 text-white disabled:bg-muted disabled:text-muted-foreground w-full py-3 flex items-center justify-center gap-2 transition-colors"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Generating Music...
            </>
          ) : (
            <>
              <Music className="w-4 h-4" />
              Generate Music
            </>
          )}
        </button>

        {/* Audio Player */}
        {audioUrl && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            {mockMode && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 mb-3">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs">
                  This is a demo. Add your API key to generate real music.
                </span>
              </div>
            )}

            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-foreground">
                {mockMode ? 'Demo Audio' : 'Your Generated Music'}
              </h4>
              {!mockMode && (
                <a
                  href={audioUrl}
                  download="generated-music.mp3"
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              )}
            </div>

            <div className="bg-background rounded-lg p-3">
              <audio
                controls
                className="w-full"
                onPlay={handleAudioPlay}
                onPause={handleAudioPause}
                onEnded={() => setIsPlaying(false)}
              >
                <source src={audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>

            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              {isPlaying ? (
                <>
                  <Play className="w-3 h-3 text-green-500" />
                  Playing...
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3" />
                  Ready to play
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
