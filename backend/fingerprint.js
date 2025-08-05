// Browser Fingerprinting Script
// This script will be injected into proxied pages to collect fingerprint data

(function() {
    'use strict';
    
    // Only run once per page
    if (window.__fingerprintLoaded) return;
    window.__fingerprintLoaded = true;
    
    // FingerprintJS library URL
    const FPJS_URL = 'https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@3/dist/fp.min.js';
    
    // Load FingerprintJS and collect data
    async function collectFingerprint() {
        try {
            // Load FingerprintJS
            const script = document.createElement('script');
            script.src = FPJS_URL;
            script.onload = async () => {
                try {
                    const fp = await FingerprintJS.load();
                    const result = await fp.get();
                    
                    // Collect additional browser data
                    const additionalData = {
                        screen: {
                            width: screen.width,
                            height: screen.height,
                            availWidth: screen.availWidth,
                            availHeight: screen.availHeight,
                            colorDepth: screen.colorDepth,
                            pixelDepth: screen.pixelDepth
                        },
                        window: {
                            innerWidth: window.innerWidth,
                            innerHeight: window.innerHeight,
                            outerWidth: window.outerWidth,
                            outerHeight: window.outerHeight
                        },
                        navigator: {
                            language: navigator.language,
                            languages: navigator.languages,
                            cookieEnabled: navigator.cookieEnabled,
                            doNotTrack: navigator.doNotTrack,
                            onLine: navigator.onLine,
                            platform: navigator.platform,
                            userAgent: navigator.userAgent
                        },
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        timestamp: Date.now()
                    };
                    
                    // Send fingerprint data to backend
                    await sendFingerprintData(result.visitorId, additionalData);
                    
                } catch (error) {
                    console.error('Fingerprint collection error:', error);
                }
            };
            script.onerror = () => {
                console.error('Failed to load FingerprintJS');
            };
            document.head.appendChild(script);
            
        } catch (error) {
            console.error('Fingerprint script error:', error);
        }
    }
    
    // Send fingerprint data to backend
    async function sendFingerprintData(visitorId, additionalData) {
        try {
            const response = await fetch('/__fp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    visitorId: visitorId,
                    timestamp: Date.now(),
                    fingerprint: additionalData
                })
            });
            
            if (response.ok) {
                console.log('Fingerprint data sent successfully');
            } else {
                console.error('Failed to send fingerprint data');
            }
        } catch (error) {
            console.error('Error sending fingerprint data:', error);
        }
    }
    
    // Start fingerprinting when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', collectFingerprint);
    } else {
        collectFingerprint();
    }
    
    // Also run on page visibility change (for SPA navigation)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Small delay to ensure page is fully loaded
            setTimeout(collectFingerprint, 1000);
        }
    });
    
})(); 