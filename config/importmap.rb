# Pin npm packages by running ./bin/importmap

pin "application", preload: true
pin "@hotwired/turbo-rails", to: "turbo.min.js"
pin "@hotwired/stimulus", to: "stimulus.min.js"
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js"
pin_all_from "app/javascript/controllers", under: "controllers"

# Explicit pins to ensure proper asset resolution in production
# These override pin_all_from for more reliable asset hash resolution
pin "controllers/application", to: "controllers/application.js"
pin "controllers/cesium_controller", to: "controllers/cesium_controller.js"
pin "controllers/cesium_impact_controller", to: "controllers/cesium_impact_controller.js"
pin "controllers/earth_controller", to: "controllers/earth_controller.js"
pin "controllers/hello_controller", to: "controllers/hello_controller.js"
pin "controllers/impact_controller", to: "controllers/impact_controller.js"
pin "controllers/index", to: "controllers/index.js"
pin "controllers/neo_browser_controller", to: "controllers/neo_browser_controller.js"
pin "controllers/neo_selector_controller", to: "controllers/neo_selector_controller.js"

pin "three", to: "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js"

# examples modules (no local files needed)
pin "OrbitControls", to: "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/OrbitControls.js"
pin "FlyControls",   to: "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/FlyControls.js"
pin "Lensflare",     to: "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/objects/Lensflare.js"

pin "EffectComposer", to: "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/postprocessing/EffectComposer.js"
pin "RenderPass",     to: "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/postprocessing/RenderPass.js"
pin "ShaderPass",     to: "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/postprocessing/ShaderPass.js"
pin "Pass",           to: "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/postprocessing/Pass.js"
pin "MaskPass",       to: "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/postprocessing/MaskPass.js"
pin "UnrealBloomPass", to: "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/postprocessing/UnrealBloomPass.js"

pin "CopyShader",               to: "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/shaders/CopyShader.js"
pin "LuminosityHighPassShader", to: "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/shaders/LuminosityHighPassShader.js"

pin "d3" # @7.9.0
pin "d3-array" # @3.2.4
pin "d3-axis" # @3.0.0
pin "d3-brush" # @3.0.0
pin "d3-chord" # @3.0.1
pin "d3-color" # @3.1.0
pin "d3-contour" # @4.0.2
pin "d3-delaunay" # @6.0.4
pin "d3-dispatch" # @3.0.1
pin "d3-drag" # @3.0.0
pin "d3-dsv" # @3.0.1
pin "d3-ease" # @3.0.1
pin "d3-fetch" # @3.0.1
pin "d3-force" # @3.0.0
pin "d3-format" # @3.1.0
pin "d3-geo" # @3.1.1
pin "d3-hierarchy" # @3.1.2
pin "d3-interpolate" # @3.0.1
pin "d3-path" # @3.1.0
pin "d3-polygon" # @3.0.1
pin "d3-quadtree" # @3.0.1
pin "d3-random" # @3.0.1
pin "d3-scale" # @4.0.2
pin "d3-scale-chromatic" # @3.1.0
pin "d3-selection" # @3.0.0
pin "d3-shape" # @3.2.0
pin "d3-time" # @3.1.0
pin "d3-time-format" # @4.1.0
pin "d3-timer" # @3.0.1
pin "d3-transition" # @3.0.1
pin "d3-zoom" # @3.0.0
pin "delaunator" # @5.0.1
pin "internmap" # @2.0.3
pin "robust-predicates" # @3.0.2
pin "topojson-client" # @3.1.0