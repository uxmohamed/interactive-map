// Interactive SVG World Map
class InteractiveMap {
    constructor() {
        this.mapContainer = document.getElementById('mapContainer');
        this.worldMap = document.getElementById('worldMap');
        
        // Target countries for interaction
        this.targetCountries = [
            'Egypt', 'United Arab Emirates', 'Yemen', 'Libya', 'Somalia', 'Kenya', 
            'Iraq', 'Ethiopia', 'Uganda', 'Tanzania', 
            'Nigeria', 'Cameroon', 'South Sudan', 'Djibouti', 'Côte d\'Ivoire'
        ];
        
        this.init();
    }
    
    async init() {
        await this.loadSVGMap();
        this.setupInteractivity();
        this.setupMouseTracking();
    }
    
    async loadSVGMap() {
        try {
            const response = await fetch('https://cdn.jsdelivr.net/gh/uxmohamed/interactive-map@main/assets/world%201.svg');
            const svgText = await response.text();
            
            // Parse the SVG and extract the content
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
            const svgContent = svgDoc.querySelector('svg');
            
            if (svgContent) {
                // Use the new SVG with proper viewBox
                svgContent.setAttribute('viewBox', '0 0 532 583');
                svgContent.setAttribute('width', '100%');
                svgContent.setAttribute('height', '100%');
                svgContent.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                
                // Clear existing content and add the SVG
                this.worldMap.innerHTML = '';
                this.worldMap.appendChild(svgContent);
                
                // Add classes to all path elements for styling
                const paths = this.worldMap.querySelectorAll('path');
                paths.forEach((path, index) => {
                    path.classList.add('country');
                    // Add a data attribute for identification
                    path.setAttribute('data-index', index);
                });
                
                // Add blue markers for target countries
                this.addCountryMarkers();
            }
        } catch (error) {
            console.error('Error loading SVG map:', error);
            this.showError();
        }
    }
    
    calculateCountryCenters() {
        const markerPositions = {};
        
        // Find all country paths and calculate their centers
        const countries = this.worldMap.querySelectorAll('path');
        console.log(`Found ${countries.length} countries in SVG`);
        
        countries.forEach(country => {
            const countryName = country.getAttribute('name');
            if (countryName && this.targetCountries.includes(countryName)) {
                const center = this.getPathCenter(country);
                if (center) {
                    markerPositions[countryName] = center;
                    console.log(`Calculated center for ${countryName}: (${center.x}, ${center.y})`);
                } else {
                    // Fallback to approximate positions if center calculation fails
                    console.log(`Failed to calculate center for ${countryName}, using fallback`);
                    markerPositions[countryName] = this.getFallbackPosition(countryName);
                }
            }
        });
        
        // Log all calculated positions
        console.log('All marker positions:', markerPositions);
        return markerPositions;
    }
    
    getFallbackPosition(countryName) {
        // Fallback positions for each country (adjusted for 532x583 viewBox)
        const fallbackPositions = {
            'Egypt': { x: 280, y: 180 },
            'United Arab Emirates': { x: 450, y: 180 },
            'Yemen': { x: 400, y: 200 },
            'Libya': { x: 250, y: 200 },
            'Somalia': { x: 450, y: 270 },
            'Kenya': { x: 400, y: 340 },
            'Iraq': { x: 350, y: 170 },
            'Ethiopia': { x: 400, y: 270 },
            'Uganda': { x: 350, y: 340 },
            'Tanzania': { x: 400, y: 400 },
            'Nigeria': { x: 200, y: 340 },
            'Cameroon': { x: 250, y: 370 },
            'South Sudan': { x: 350, y: 300 },
            'Djibouti': { x: 430, y: 240 },
            'Côte d\'Ivoire': { x: 150, y: 370 }
        };
        
        return fallbackPositions[countryName] || { x: 266, y: 292 };
    }
    
    getPathCenter(pathElement) {
        const pathData = pathElement.getAttribute('d');
        if (!pathData) return null;
        
        // Get the bounding box of the path element
        const bbox = pathElement.getBBox();
        if (bbox && bbox.width > 0 && bbox.height > 0) {
            return {
                x: Math.round(bbox.x + bbox.width / 2),
                y: Math.round(bbox.y + bbox.height / 2)
            };
        }
        
        // Fallback: Extract coordinates from path data
        const coords = pathData.match(/-?\d+\.?\d*/g);
        if (!coords || coords.length < 2) return null;
        
        let xSum = 0, ySum = 0, count = 0;
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        
        // Process coordinates in pairs (x, y)
        for (let i = 0; i < coords.length; i += 2) {
            if (coords[i] && coords[i + 1]) {
                const x = parseFloat(coords[i]);
                const y = parseFloat(coords[i + 1]);
                
                // Skip invalid coordinates
                if (!isNaN(x) && !isNaN(y)) {
                    xSum += x;
                    ySum += y;
                    count++;
                    
                    // Track bounds for better center calculation
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }
        
        if (count === 0) return null;
        
        // Use bounding box center if available, otherwise use average
        if (minX !== Infinity && maxX !== -Infinity) {
            return {
                x: Math.round((minX + maxX) / 2),
                y: Math.round((minY + maxY) / 2)
            };
        }
        
        return {
            x: Math.round(xSum / count),
            y: Math.round(ySum / count)
        };
    }

    addCountryMarkers() {
        // Calculate center positions for each target country
        const markerPositions = this.calculateCountryCenters();
        
        console.log('Marker positions calculated:', markerPositions);
        
        // Create a group for markers
        const markersGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        markersGroup.setAttribute('class', 'country-markers');
        
        // Add markers for each target country
        this.targetCountries.forEach(countryName => {
            const position = markerPositions[countryName];
            console.log(`Processing ${countryName}, position:`, position);
            if (position) {
                // Create a group for each marker (square + text)
                const markerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                markerGroup.setAttribute('class', 'marker-group');
                markerGroup.setAttribute('data-country', countryName);
                
                // Create the blue square (will morph on hover)
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                marker.setAttribute('x', position.x - 10);
                marker.setAttribute('y', position.y - 10);
                marker.setAttribute('width', '20');
                marker.setAttribute('height', '20');
                marker.setAttribute('fill', '#0279c1');
                marker.setAttribute('class', 'country-marker');
                marker.setAttribute('rx', '3'); // Rounded corners
                
                // Create the text element (initially hidden)
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', position.x);
                text.setAttribute('y', position.y + 2);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'middle');
                text.setAttribute('class', 'marker-text');
                text.setAttribute('fill', 'white');
                text.setAttribute('font-size', '12');
                text.setAttribute('font-weight', 'semibold');
                text.setAttribute('font-family', '"Geist Mono", sans-serif');
                text.textContent = countryName.toUpperCase();
                text.style.opacity = '0';
                text.style.pointerEvents = 'none';
                
                // Store original dimensions for morphing
                marker.setAttribute('data-original-x', position.x - 10);
                marker.setAttribute('data-original-y', position.y - 10);
                marker.setAttribute('data-original-width', '20');
                marker.setAttribute('data-original-height', '20');
                
                markerGroup.appendChild(marker);
                markerGroup.appendChild(text);
                markersGroup.appendChild(markerGroup);
            }
        });
        
        // Add the markers group to the SVG
        this.worldMap.appendChild(markersGroup);
        
        console.log('Markers group added to SVG, total markers:', markersGroup.children.length);
        
        // Add interactivity to markers
        this.setupMarkerInteractivity();
    }
    
    setupMarkerInteractivity() {
        const markerGroups = this.worldMap.querySelectorAll('.marker-group');
        console.log(`Found ${markerGroups.length} marker groups for interactivity`);
        
        markerGroups.forEach(markerGroup => {
            const countryName = markerGroup.getAttribute('data-country');
            const marker = markerGroup.querySelector('.country-marker');
            const text = markerGroup.querySelector('.marker-text');
            
            console.log(`Setting up interactivity for marker: ${countryName}`);
            
            // Disable pointer events on markers so they don't interfere with country hover
            markerGroup.style.pointerEvents = 'none';
            
            // Create methods to animate the marker
            const animateMarkerIn = () => {
                console.log(`Animating marker in: ${countryName}`);
                
                // Calculate actual text width using canvas measurement
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                context.font = 'semibold 12px "Geist Mono", monospace, sans-serif';
                const textMetrics = context.measureText(countryName.toUpperCase());
                const actualTextWidth = textMetrics.width;
                
                // Add consistent padding
                const horizontalPadding = 20; // 10px padding on each side
                const verticalPadding = 12; // 6px padding on top and bottom
                
                const textWidth = Math.max(actualTextWidth + horizontalPadding + 8, 20); // Extra 8px buffer
                const textHeight = 16 + verticalPadding; // Base height + padding
                
                // Get original position
                const originalX = parseFloat(marker.getAttribute('data-original-x'));
                const originalY = parseFloat(marker.getAttribute('data-original-y'));
                
                // Morph the square to fit the text with proper centering
                marker.setAttribute('x', originalX - (textWidth - 20) / 2);
                marker.setAttribute('y', originalY - (textHeight - 20) / 2);
                marker.setAttribute('width', textWidth);
                marker.setAttribute('height', textHeight);
                
                // Show text inside the square with blur animation
                text.style.filter = 'blur(6px)';
                text.style.opacity = '1';
                text.style.transition = 'opacity 0.2s ease, filter 0.25s ease';
                
                // Animate blur to clear
        setTimeout(() => {
                    text.style.filter = 'blur(0px)';
                }, 10);
            };
            
            const animateMarkerOut = () => {
                console.log(`Animating marker out: ${countryName}`);
                
                // Restore original square size
                const originalX = marker.getAttribute('data-original-x');
                const originalY = marker.getAttribute('data-original-y');
                const originalWidth = marker.getAttribute('data-original-width');
                const originalHeight = marker.getAttribute('data-original-height');
                
                marker.setAttribute('x', originalX);
                marker.setAttribute('y', originalY);
                marker.setAttribute('width', originalWidth);
                marker.setAttribute('height', originalHeight);
                
                // Hide text inside the square
                text.style.opacity = '0';
            };
            
            // Store the animation methods on the marker group
            markerGroup.animateIn = animateMarkerIn;
            markerGroup.animateOut = animateMarkerOut;
        });
    }
    
    setupInteractivity() {
        // Add hover event listeners to all country paths
        const countries = this.worldMap.querySelectorAll('path');

        console.log(`Found ${countries.length} country paths in SVG`);

        countries.forEach((country, index) => {
            // Get country name from the 'name' attribute
            const countryName = country.getAttribute('name');

            // Debug: log identified countries
            if (countryName) {
                console.log(`Country ${index}: ${countryName}`);
            }

            if (countryName && this.targetCountries.includes(countryName)) {
                country.classList.add('interactive');
                console.log(`Made ${countryName} interactive`);

                country.addEventListener('mouseenter', (e) => {
                    // Trigger blue square animation
                    this.triggerMarkerAnimation(countryName, true);
                });

                country.addEventListener('mouseleave', () => {
                    // Stop blue square animation
                    this.triggerMarkerAnimation(countryName, false);
                });
            }
        });

        console.log(`Interactive countries: ${this.targetCountries.join(', ')}`);
    }
    
    triggerMarkerAnimation(countryName, isHovered) {
        // Find the marker group for this country
        const markerGroup = this.worldMap.querySelector(`[data-country="${countryName}"]`);
        if (markerGroup) {
            if (isHovered) {
                // Trigger the marker animation (morph to show text)
                if (markerGroup.animateIn) {
                    markerGroup.animateIn();
                }
            } else {
                // Stop the marker animation (return to square)
                if (markerGroup.animateOut) {
                    markerGroup.animateOut();
                }
            }
        }
    }
    
    getCountryNameByFilterId(countryElement) {
        // Get the parent group to find the filter ID
        const parentGroup = countryElement.closest('g');
        if (!parentGroup) return null;
        
        const filterId = parentGroup.getAttribute('filter');
        if (!filterId) return null;
        
        // Map filter IDs to country names based on the SVG structure
        const filterMap = {
            'url(#filter0_d_9224_2875)': 'Sudan',
            'url(#filter1_d_9224_2875)': 'Libya',
            'url(#filter2_d_9224_2875)': 'Egypt',
            'url(#filter3_d_9224_2875)': 'Ethiopia',
            'url(#filter4_d_9224_2875)': 'Somalia',
            'url(#filter5_d_9224_2875)': 'Kenya',
            'url(#filter6_d_9224_2875)': 'Tanzania',
            'url(#filter7_d_9224_2875)': 'Uganda',
            'url(#filter8_d_9224_2875)': 'Eritrea',
            'url(#filter9_d_9224_2875)': 'Djibouti',
            'url(#filter10_d_9224_2875)': 'Nigeria',
            'url(#filter11_d_9224_2875)': 'Cameroon',
            'url(#filter12_d_9224_2875)': 'Cote D\'ivoire',
            'url(#filter13_d_9224_2875)': 'Yemen',
            'url(#filter14_d_9224_2875)': 'UAE',
            'url(#filter15_d_9224_2875)': 'Iraq'
        };
        
        return filterMap[filterId] || null;
    }
    
    getCountryNameByIndex(index) {
        // Map of country indices to country names based on the SVG structure
        // This mapping is based on the order of countries in the SVG file
        const countryMap = {
            0: 'Sudan',
            1: 'Libya', 
            2: 'Egypt',
            3: 'Ethiopia',
            4: 'Somalia',
            5: 'Kenya',
            6: 'Tanzania',
            7: 'Uganda',
            8: 'Eritrea',
            9: 'Djibouti',
            10: 'Nigeria',
            11: 'Cameroon',
            12: 'Cote D\'ivoire',
            13: 'Yemen',
            14: 'UAE',
            15: 'Iraq'
        };
        
        return countryMap[index] || null;
    }
    
    // Alternative method to identify countries by analyzing path coordinates
    identifyCountryByCoordinates(pathElement) {
        const pathData = pathElement.getAttribute('d');
        if (!pathData) return null;
        
        // Extract coordinates from path data
        const coords = pathData.match(/-?\d+\.?\d*/g);
        if (!coords || coords.length < 2) return null;
        
        // Calculate approximate center point
        let xSum = 0, ySum = 0, count = 0;
        for (let i = 0; i < coords.length; i += 2) {
            if (coords[i] && coords[i + 1]) {
                xSum += parseFloat(coords[i]);
                ySum += parseFloat(coords[i + 1]);
                count++;
            }
        }
        
        if (count === 0) return null;
        
        const centerX = xSum / count;
        const centerY = ySum / count;
        
        // Map coordinates to countries (adjusted for 818x873 viewBox)
        if (centerX > 350 && centerX < 400 && centerY > 180 && centerY < 220) {
            return 'Libya';
        } else if (centerX > 420 && centerX < 480 && centerY > 180 && centerY < 220) {
            return 'Egypt';
        } else if (centerX > 420 && centerX < 480 && centerY > 250 && centerY < 300) {
            return 'Sudan';
        } else if (centerX > 520 && centerX < 580 && centerY > 250 && centerY < 300) {
            return 'Ethiopia';
        } else if (centerX > 600 && centerX < 650 && centerY > 250 && centerY < 300) {
            return 'Somalia';
        } else if (centerX > 520 && centerX < 580 && centerY > 330 && centerY < 380) {
            return 'Kenya';
        } else if (centerX > 520 && centerX < 580 && centerY > 420 && centerY < 480) {
            return 'Tanzania';
        } else if (centerX > 420 && centerX < 480 && centerY > 330 && centerY < 380) {
            return 'Uganda';
        } else if (centerX > 520 && centerX < 580 && centerY > 200 && centerY < 250) {
            return 'Eritrea';
        } else if (centerX > 560 && centerX < 600 && centerY > 200 && centerY < 250) {
            return 'Djibouti';
        } else if (centerX > 270 && centerX < 320 && centerY > 330 && centerY < 380) {
            return 'Nigeria';
        } else if (centerX > 310 && centerX < 360 && centerY > 380 && centerY < 420) {
            return 'Cameroon';
        } else if (centerX > 190 && centerX < 240 && centerY > 380 && centerY < 420) {
            return 'Cote D\'ivoire';
        } else if (centerX > 520 && centerX < 580 && centerY > 180 && centerY < 220) {
            return 'Yemen';
        } else if (centerX > 600 && centerX < 650 && centerY > 160 && centerY < 200) {
            return 'UAE';
        } else if (centerX > 470 && centerX < 520 && centerY > 130 && centerY < 170) {
            return 'Iraq';
        }
        
        return null;
    }
    
    getCountryName(countryElement) {
        // Try to get country name from various attributes
        const id = countryElement.getAttribute('id');
        const title = countryElement.getAttribute('title');
        const dataName = countryElement.getAttribute('data-name');
        
        // Return the first available name, or a default
        return id || title || dataName || 'Unknown';
    }
    
    setupMouseTracking() {
        let targetX = 50;
        let targetY = 50;
        let currentX = 50;
        let currentY = 50;
        
        this.worldMap.addEventListener('mousemove', (e) => {
            const rect = this.worldMap.getBoundingClientRect();
            targetX = ((e.clientX - rect.left) / rect.width) * 100;
            targetY = ((e.clientY - rect.top) / rect.height) * 100;
        });
        
        // Smooth interpolation with delay
        const animate = () => {
            currentX += (targetX - currentX) * 0.1;
            currentY += (targetY - currentY) * 0.1;
            
            this.worldMap.style.setProperty('--mouse-x', `${currentX}%`);
            this.worldMap.style.setProperty('--mouse-y', `${currentY}%`);
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    showError() {
        this.worldMap.innerHTML = `
            <text x="500" y="300" text-anchor="middle" fill="#666" font-size="18">
                Error loading map. Please refresh the page.
            </text>
        `;
    }
}

// Initialize the map when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InteractiveMap();
});
