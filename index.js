var aimlHigh = require('aiml-high');
var rest = require('restler');

module.exports = {
    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        var aimlUrl = step('aiml_url');
        var message = step('message');

        // Validations: Ensure URL is correct and a message is passed
        if(aimlUrl === undefined || !aimlUrl.length || !aimlUrl.match(/^http(s)?\:\/\//i)) {
          return this.fail({'message': 'Invalid AIML URL'});
        }
        else if(message === undefined || !message.length) {
          return this.fail({'message': 'Invalid message'});
        }

        // Setup valid  variables and options
        var self = this;
        var variables = step('variables');
        if (variables === undefined || typeof(variables) !== 'object') {
          variables = {};
        }

        // Get AIML file and process
        rest.get(aimlUrl).on('complete', function(result, response) {
          if (response.statusCode != 200) {
              return self.fail({
                  statusCode: response.statusCode,
                  headers: response.headers,
                  data: result,
                  message: 'Posting failed. Invalid status code: ' + response.statusCode
              });
          }

          // Setup AIML and load AIML file
          var interpret = new aimlHigh(variables);
          interpret.loadFromString(response.raw.toString());

          // Find our result
          interpret.findAnswer(message, function(answer, wildCardArray, input){
            // Answers may also come back as `undefined`.
            self.complete({
              response: answer
            });
          });
        });
    }
};
