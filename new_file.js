var messagebird = require('messagebird')('15xzXH0nN6fFMmY33sP3k0cTH');

    var params = {
      'originator': 'MessageBird',
      'recipients': [
        '+918000320314'
    ],
      'body': 'hello jhdhsdjfjsdf'
    };

    messagebird.messages.create(params, function (err, response) {
      if (err) {
        return console.log(err);
      }
      console.log(response);
    });