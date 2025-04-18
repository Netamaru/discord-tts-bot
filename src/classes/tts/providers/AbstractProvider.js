/**
 * This class represents an abstract TTS provider. Any TTS provider should create a concrete implementation of this class.
 * @params {TTSClient} client The client that this provider will serve. Get any secrets (if required) from its config.
 */
class AbstractProvider {
  constructor(client) {
    if (new.target === AbstractProvider) {
      throw new TypeError("Cannot instantiate AbstractProvider!");
    }
  }

  /**
   * Receives a sentence and returns a promise that resolves to the corresponding TTS payload (or array of payloads) for the TTSPlayer.
   * @param {string} sentence The sentence for the TTSPlayer.
   * @param {Record<string, any>}  extras The extra data required for the provider.
   * @returns {Promise<Payload> | Promise<Payload[]>} A promise that resolves to the TTS payload.
   */
  createPayload(sentence, extras) {
    throw new Error("Method not implemented!");
  }

  /**
   * Gets the message to log once a TTS message has been played.
   * @param {Payload} payload The payload for this TTS message.
   * @param {Discord.Guild} guild The guild where the TTS message was played.
   * @returns {string} The message to log once the TTS message has been played.
   */
  getPlayLogMessage(payload, guild) {
    throw new Error("Method not implemented!");
  }
}

module.exports = AbstractProvider;
