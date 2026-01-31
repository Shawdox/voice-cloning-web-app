> ## Documentation Index
>
> Fetch the complete documentation index at: <https://docs.fish.audio/llms.txt>
> Use this file to discover all available pages before exploring further.

# Text to Speech

> Convert text to speech

<Warning>
  This endpoint only accepts `application/json` and `application/msgpack`.

  For best results, upload reference audio using the [create model](/api-reference/endpoint/model/create-model) before using this one. This improves speech quality and reduces latency.

  To upload audio clips directly, without pre-uploading, serialize the request body with MessagePack as per the [instructions](/developer-guide/core-features/text-to-speech#direct-api-usage).
</Warning>

<Note>
  Audio formats supported:

* WAV / PCM
  * Sample Rate: 8kHz, 16kHz, 24kHz, 32kHz, 44.1kHz
  * Default Sample Rate: 44.1kHz
  * 16-bit, mono
* MP3
  * Sample Rate: 32kHz, 44.1kHz
  * Default Sample Rate: 44.1kHz
  * mono
  * Bitrate: 64kbps, 128kbps (default), 192kbps
* Opus
  * Sample Rate: 48kHz
  * Default Sample Rate: 48kHz
  * mono
  * Bitrate: -1000 (auto), 24kbps, 32kbps (default), 48kbps, 64kbps
</Note>

## OpenAPI

````yaml post /v1/tts
openapi: 3.1.0
info:
  title: FishAudio OpenAPI
  version: '1'
servers:
  - url: https://api.fish.audio
    description: Fish Audio API
security: []
tags: []
paths:
  /v1/tts:
    post:
      tags:
        - OpenAPI v1
      summary: Text to Speech
      parameters:
        - in: header
          name: model
          description: Specify which TTS model to use. We recommend `s1`
          required: true
          schema:
            type: string
            default: s1
            enum:
              - s1
              - speech-1.6
              - speech-1.5
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TTSRequest'
          application/msgpack:
            schema:
              $ref: '#/components/schemas/TTSRequest'
      responses:
        '200':
          description: Request fulfilled, document follows
          headers:
            Transfer-Encoding:
              schema:
                type: string
              description: chunked
        '401':
          description: No permission -- see authorization schemes
          headers: {}
          content:
            application/json:
              schema:
                properties:
                  status:
                    title: Status
                    type: integer
                  message:
                    title: Message
                    type: string
                required:
                  - status
                  - message
                type: object
        '402':
          description: No payment -- see charging schemes
          headers: {}
          content:
            application/json:
              schema:
                properties:
                  status:
                    title: Status
                    type: integer
                  message:
                    title: Message
                    type: string
                required:
                  - status
                  - message
                type: object
        '422':
          description: ''
          headers: {}
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    loc:
                      title: Location
                      description: error field
                      type: array
                      items:
                        type: string
                    type:
                      title: Type
                      description: error type
                      type: string
                    msg:
                      title: Message
                      description: error message
                      type: string
                    ctx:
                      title: Context
                      description: error context
                      type: string
                    in:
                      title: In
                      type: string
                      enum:
                        - path
                        - query
                        - header
                        - cookie
                        - body
                  required:
                    - loc
                    - type
                    - msg
      security:
        - BearerAuth: []
components:
  schemas:
    TTSRequest:
      description: Request body for text-to-speech synthesis.
      type: object
      required:
        - text
      properties:
        text:
          description: Text to convert to speech.
          title: Text
          type: string
        temperature:
          description: >-
            Controls expressiveness. Higher is more varied, lower is more
            consistent.
          title: Temperature
          type: number
          default: 0.7
          minimum: 0
          maximum: 1
        top_p:
          description: Controls diversity via nucleus sampling.
          title: Top P
          type: number
          default: 0.7
          minimum: 0
          maximum: 1
        references:
          anyOf:
            - items:
                $ref: '#/components/schemas/ReferenceAudio'
              type: array
            - type: 'null'
          description: >-
            Inline voice references for zero-shot cloning. Requires MessagePack
            (not JSON). Ignored if reference_id is provided.
          title: References
        reference_id:
          anyOf:
            - type: string
            - type: 'null'
          default: null
          description: Voice model ID from the Fish Audio library or your custom models.
          title: Reference Id
        prosody:
          anyOf:
            - $ref: '#/components/schemas/ProsodyControl'
            - type: 'null'
          default: null
          description: Speed and volume adjustments for the output.
        chunk_length:
          default: 300
          description: Text segment size for processing.
          maximum: 300
          minimum: 100
          title: Chunk Length
          type: integer
        normalize:
          default: true
          description: >-
            Normalizes text for English and Chinese, improving stability for
            numbers.
          title: Normalize
          type: boolean
        format:
          default: mp3
          description: Output audio format.
          enum:
            - wav
            - pcm
            - mp3
            - opus
          title: Format
          type: string
        sample_rate:
          anyOf:
            - type: integer
            - type: 'null'
          default: null
          description: >-
            Audio sample rate in Hz. When null, uses the format's default (44100
            Hz for most formats, 48000 Hz for opus).
          title: Sample Rate
        mp3_bitrate:
          default: 128
          description: MP3 bitrate in kbps. Only applies when format is mp3.
          enum:
            - 64
            - 128
            - 192
          title: Mp3 Bitrate
          type: integer
        opus_bitrate:
          default: -1000
          description: >-
            Opus bitrate in bps. -1000 for automatic. Only applies when format
            is opus.
          enum:
            - -1000
            - 24
            - 32
            - 48
            - 64
          title: Opus Bitrate
          type: integer
        latency:
          default: normal
          description: >-
            Latency-quality trade-off. normal: best quality, balanced: reduced
            latency, low: lowest latency.
          enum:
            - low
            - normal
            - balanced
          title: Latency
          type: string
        max_new_tokens:
          default: 1024
          description: Maximum audio tokens to generate per text chunk.
          title: Max New Tokens
          type: integer
        repetition_penalty:
          default: 1.2
          description: >-
            Penalty for repeating audio patterns. Values above 1.0 reduce
            repetition.
          title: Repetition Penalty
          type: number
        min_chunk_length:
          default: 50
          description: Minimum characters before splitting into a new chunk.
          minimum: 0
          maximum: 100
          title: Min Chunk Length
          type: integer
        condition_on_previous_chunks:
          default: true
          description: Use previous audio as context for voice consistency.
          title: Condition On Previous Chunks
          type: boolean
        early_stop_threshold:
          default: 1
          description: Early stopping threshold for batch processing.
          title: Early Stop Threshold
          type: number
          minimum: 0
          maximum: 1
      title: TTSRequest
    ReferenceAudio:
      description: >-
        A voice sample with its transcript, used for zero-shot voice cloning.
        The model will attempt to match the voice characteristics from the audio
        sample.
      properties:
        audio:
          format: binary
          description: >-
            Raw audio bytes of the voice sample. Supported formats: WAV, MP3,
            FLAC. For best results, use 10-30 seconds of clear speech with
            minimal background noise.
          title: Audio
          type: string
        text:
          description: >-
            The exact transcript of what is spoken in the audio sample. Accuracy
            is important for voice cloning quality.
          title: Text
          type: string
      required:
        - audio
        - text
      title: ReferenceAudio
      type: object
    ProsodyControl:
      description: >-
        Controls for adjusting the prosody (rhythm and intonation) of generated
        speech.
      properties:
        speed:
          default: 1
          description: >-
            Speaking rate multiplier. Valid range: 0.5 to 2.0. 1.0 = normal
            speed, 0.5 = half speed, 2.0 = double speed. Useful for adjusting
            pacing without regenerating audio.
          title: Speed
          type: number
        volume:
          default: 0
          description: >-
            Volume adjustment in decibels (dB). 0 = no change, positive values =
            louder, negative values = quieter.
          title: Volume
          type: number
      title: ProsodyControl
      type: object
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer

````
