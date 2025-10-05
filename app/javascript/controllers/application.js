import { Application } from "@hotwired/stimulus";

const application = Application.start();

// Configure Stimulus development experience
application.debug = Rails?.env?.development ? true : false;
window.Stimulus = application;

// Add production debugging
if (typeof Rails === 'undefined' || Rails.env === 'production') {
  application.debug = true; // Enable debug in production to troubleshoot
  console.log('Stimulus application started in production mode');
}

Stimulus.handleError = (error, message, detail) => {
  console.warn('Stimulus error:', message, detail);
  console.error(error);
//   ErrorTrackingSystem.captureException(error);
};

// Debug controller registration
const originalRegister = application.register;
application.register = function(name, constructor) {
  console.log(`Registering Stimulus controller: ${name}`);
  return originalRegister.call(this, name, constructor);
};

export { application };

