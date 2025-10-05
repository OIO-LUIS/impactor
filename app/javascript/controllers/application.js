import { Application } from "@hotwired/stimulus";

const application = Application.start();

// Configure Stimulus development experience
application.debug = false;
window.Stimulus = application;

Stimulus.handleError = (error, message, detail) => {
  console.warn(message, detail);
//   ErrorTrackingSystem.captureException(error);
};

export { application };

