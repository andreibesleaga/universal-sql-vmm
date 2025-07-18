const { expect } = require('chai');
const { ErrorTypes, AppError, handleError } = require('../../../utils/errorHandler');

describe('Error Handler', () => {
  describe('AppError', () => {
    it('should create an error with the correct properties', () => {
      const error = new AppError('Test error', ErrorTypes.VALIDATION, { test: 'context' });
      
      expect(error).to.be.instanceOf(Error);
      expect(error.name).to.equal('AppError');
      expect(error.message).to.equal('Test error');
      expect(error.type).to.equal(ErrorTypes.VALIDATION);
      expect(error.context).to.deep.equal({ test: 'context' });
      expect(error.timestamp).to.be.a('string');
    });

    it('should use default error type if not provided', () => {
      const error = new AppError('Test error');
      expect(error.type).to.equal(ErrorTypes.UNKNOWN);
    });
  });

  describe('handleError', () => {
    it('should format regular Error into AppError response', () => {
      const error = new Error('Regular error');
      const response = handleError(error);
      
      expect(response).to.have.property('error');
      expect(response.error.type).to.equal(ErrorTypes.UNKNOWN);
      expect(response.error.message).to.equal('Regular error');
    });

    it('should preserve AppError properties in response', () => {
      const appError = new AppError('App error', ErrorTypes.VALIDATION);
      const response = handleError(appError);
      
      expect(response).to.have.property('error');
      expect(response.error.type).to.equal(ErrorTypes.VALIDATION);
      expect(response.error.message).to.equal('App error');
    });

    it('should handle HTTP response if res object is provided', () => {
      const appError = new AppError('Validation error', ErrorTypes.VALIDATION);
      const mockRes = {
        status: function(code) {
          this.statusCode = code;
          return this;
        },
        json: function(data) {
          this.data = data;
          return this;
        }
      };
      
      handleError(appError, null, mockRes);
      
      expect(mockRes.statusCode).to.equal(400); // Validation errors are 400
      expect(mockRes.data).to.have.property('error');
      expect(mockRes.data.error.type).to.equal(ErrorTypes.VALIDATION);
    });
  });
});