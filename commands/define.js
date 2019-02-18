/**
 * author: ap4gh(Github) aka. debjay(on CodeCareer Discord Server)
 * command_name: define
 * version: 2.1
 * description: Search for passed text on wikipedia or ddg.
 * npm_dependencies: { request }
 */

const request = require('request');
// This func will return a formatted URL to get instant answer data from ddg in JSON format

const generateQueryURL = (serve, phrase) => {
  const queryURLs = {
    wiki: `https://en.wikipedia.org/w/api.php?action=opensearch&list=search&search=${phrase}&format=json&formatversion=2`,
    ddg: `https://api.duckduckgo.com/?q=${phrase}&format=json`
  };
  return queryURLs[serve];
};

exports.run = (client, message, args) => {
  // if nothing was passed after typing the command name:
  if (args.length === 0) {
    return message.channel.send(
      'Try `!define --help` to get list of available commands and usage examples.'
    );
  }
  /**
   * First argument can be a sub-command or word.
   */
  switch (args[0]) {
    // MAIN COMMAND: define
    default:
      /**
       * request takes two arguments, first is the option object,
       * second is a callback function.
       */
      const searchPhrase = args.slice(0, args.length).join(' ');
      request(
        // Options
        {
          url: generateQueryURL('ddg', searchPhrase),
          headers: {
            'Content-Type': 'application/json'
          }
        },
        // Callback function
        (error, response, body) => {
          // Only run when data is recieved with statusCode of 200
          if (!error && response.statusCode == 200) {
            // Parse JSON data
            const data = JSON.parse(body);
            // Abstract text
            const abstractText = data['AbstractText'];
            // If no abstractText is found then:
            if (!abstractText) {
              let msg = `Definition not provided :shrug: please check these following links or try \`!define wiki ${searchPhrase}\` for wikipedia results.\n\n`;
              data['RelatedTopics'].every((topic, index) => {
                /**
                 * For some related topics, no links are provided,
                 * hence those are not collected and the loop is
                 * exited.
                 */
                if (!topic['Text']) {
                  return false;
                } else {
                  msg += `${topic['FirstURL']}\n*${topic['Text']}*\n\n`;
                  return true;
                }
              });
              message.channel.send(msg);
            } else {
              // If abstractText is found:
              let msg = `Definition for \`${searchPhrase}\` `;
              msg += '```' + abstractText + '```';
              message.channel.send(msg);
            }
          } else {
            console.log(`Response status code: ${response.statusCode}`);
            console.log(error || 'No errors while fetching data!');
          }
        }
      );
      break;

    /* SUB COMMAND: wiki
     * description: This command does an open search for the text
     * passed by the end-user on wikipedia. Then the most accurate
     * definition and its wikipedia page link is sent in a nice
     * format.
     */
    case 'wiki':
      // search text to send to wikipedia:
      const wikiSearchPhrase = args.slice(1, args.length).join(' ');
      // request for JSON response data:
      request(
        {
          url: generateQueryURL('wiki', wikiSearchPhrase),
          headers: {
            'Content-Type': 'application/json'
          }
        },
        (error, response, body) => {
          if (!error && response.statusCode === 200) {
            // JSON parsed data is an array containing 4 elements:
            const data = JSON.parse(body);
            // definition and links:
            const definition = data[2];
            const links = data[3];
            // most accurate info:
            const firstDefinition = definition[0];
            const wikipediaPageLink = links[0];
            // creating a message format string:
            let formattedMsg = ':mag: `' + wikiSearchPhrase + '`\n';
            if (firstDefinition)
              formattedMsg += '```' + firstDefinition + '```';
            formattedMsg += ':link: ' + wikipediaPageLink + '\n\n';
            // send message:
            message.channel.send(formattedMsg);
          } else {
            console.log(`Response status code: ${response.statusCode}`);
            console.log(error || 'No errors while fetching data!');
          }
        }
      );
      break;
    // !define --help or -h
    case '-h':
    case '--help':
      message.channel.send(`
        \`\`\`
AVAILABLE COMMANDS

    1. !define <search-text>         DuckDuckGo instant answer.
    2. !define wiki <search-text>    Wikipedia definition.

EXAMPLES:

    !define yellow stone
    !define wiki object oriented programming
        \`\`\` `);
      break;
  }
};