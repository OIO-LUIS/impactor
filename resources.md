# NASA Data and Resources Used in Impactor Project

This document lists all NASA data and resources used in the Impactor application for the NASA Space Apps Challenge.

## NASA APIs and Data Services

### 1. NeoWs API (Near-Earth Object Web Service)
**Link Text:** NASA NeoWs API - Near-Earth Object Web Service
**Link URL:** https://api.nasa.gov/neo/rest/v1

**Usage:** Primary data source for Near-Earth Object information including:
- NEO physical characteristics (diameter, mass, absolute magnitude)
- Close approach data and dates
- Orbital parameters
- Potentially Hazardous Asteroid classifications
- Browse and search functionality for NEO database

**Implementation:** `app/services/neows_service.rb`, `app/controllers/neos_controller.rb`

---

### 2. SBDB API (Small-Body Database)
**Link Text:** NASA JPL Small-Body Database API
**Link URL:** https://ssd-api.jpl.nasa.gov/doc/sbdb.html

**Usage:** Fetches detailed Keplerian orbital elements for accurate trajectory calculations:
- Eccentricity, semi-major axis, inclination
- Longitude of ascending node, argument of perihelion
- Mean anomaly and epoch data
- Perihelion/aphelion distances
- Orbital periods

**Implementation:** `app/services/sbdb_service.rb`, `app/services/orbital_mechanics_service.rb`

---

### 3. Horizons API (JPL Horizons System)
**Link Text:** NASA JPL Horizons API - Ephemeris Data
**Link URL:** https://ssd-api.jpl.nasa.gov/doc/horizons.html

**Usage:** Provides highly accurate planetary positions and ephemeris data:
- Real-time planetary positions (all 8 planets)
- Heliocentric ecliptic J2000 reference frame
- Position vectors in AU and km
- Velocity vectors for orbital mechanics
- Trajectory data for timeline animations

**Implementation:** `app/services/horizons_api_service.rb`, `app/javascript/controllers/horizons_api_client.js`

---

### 4. GIBS API (Global Imagery Browse Services)
**Link Text:** NASA GIBS - Global Imagery Browse Services
**Link URL:** https://gibs.earthdata.nasa.gov/wmts/epsg3857/nrt/IMERG_Precipitation_Rate

**Usage:** Real-time Earth imagery and environmental data:
- IMERG Precipitation Rate visualization
- Near Real-Time (NRT) satellite imagery
- Web Mercator tile service for mapping

**Implementation:** `app/services/gibs_service.rb`

---

## NASA Image and Texture Resources

### 5. NASA Scientific Visualization Studio (SVS)
**Link Text:** NASA Scientific Visualization Studio - Planet Textures
**Link URL:** https://svs.gsfc.nasa.gov/cgi-bin/search.cgi?value=planet+texture

**Usage:** High-resolution, scientifically accurate planet texture maps for 3D visualization:
- Planetary surface textures
- Atmosphere and cloud layers
- Specular and normal maps

**Assets Used:** Planet textures in `app/assets/images/` (mercury.jpg, venus.jpg, mars.jpg, jupiter.jpg, saturn.jpg, uranus.jpg, neptune.jpg, sun.jpg)

---

### 6. NASA 3D Resources
**Link Text:** NASA 3D Resources - Planetary Models and Textures
**Link URL:** https://nasa3d.arc.nasa.gov/images

**Usage:** 3D models and texture resources for planetary visualization:
- Planet texture maps
- Scientific accuracy validated by NASA
- Public domain resources

**Assets Used:** Earth textures (earth_day.jpg, earth_night.jpg, earth_normal.jpg, earth_spec.jpg, earth_clouds.jpg)

---

### 7. NASA Solar System Exploration
**Link Text:** NASA Solar System Exploration - Educational Resources
**Link URL:** https://solarsystem.nasa.gov/resources/

**Usage:** Educational resources and reference data:
- Planetary facts and data
- Solar system scale references
- Scientific background information


---

## Scientific Standards and Methodologies

### 8. NASA JPL Ephemeris Standards
**Link Text:** NASA JPL Development Ephemeris
**Link URL:** https://ssd.jpl.nasa.gov/planets/eph_export.html

**Usage:** Scientific accuracy standards implemented in orbital mechanics:
- J2000 reference frame (standard epoch)
- Heliocentric ecliptic coordinate system
- Keplerian orbital element calculations
- State vector computations

**Implementation:** `app/services/orbital_mechanics_service.rb`, physics engine modules

---

### 9. NASA Impact Physics Models
**Link Text:** NASA Impact Effects Program
**Link URL:** https://impact.ese.ic.ac.uk/ImpactEarth/

**Usage:** Scientific models for impact effect calculations (reference implementation):
- Crater formation physics
- Blast wave propagation
- Thermal radiation effects
- Seismic energy calculations
- Ejecta distribution
- Tsunami generation (ocean impacts)

**Implementation:** `app/services/physics/` modules (crater.rb, blast.rb, thermal.rb, seismic.rb, tsunami.rb, ejecta.rb)

---

## Summary for NASA Space Apps Challenge Submission

**Total NASA Resources Used: 9**

1. ✅ NASA NeoWs API
2. ✅ NASA JPL Small-Body Database API
3. ✅ NASA JPL Horizons API
4. ✅ NASA GIBS (Global Imagery Browse Services)
5. ✅ NASA Scientific Visualization Studio (Planet Textures)
6. ✅ NASA 3D Resources (Earth Textures)
7. ✅ NASA Solar System Exploration (Reference Data)
8. ✅ NASA JPL Ephemeris Standards (J2000 Reference Frame)
9. ✅ NASA Impact Physics Models (Scientific Methodology)

All resources are used in compliance with NASA's open data policy and are properly attributed in the application.

---

## Additional Data Sources (Non-NASA)

For completeness, the application also uses:
- **USGS Elevation Point Query Service** (terrain elevation data)
- **USGS Earthquake API** (seismic reference data)
- **Solar System Scope** (CC BY 4.0 licensed planet textures as fallback)

These are supplementary to the core NASA data sources listed above.
