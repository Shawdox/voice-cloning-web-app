> ## Documentation Index
>
> Fetch the complete documentation index at: <https://docs.fish.audio/llms.txt>
> Use this file to discover all available pages before exploring further.

# Get Model

> Get details of a specific model

## OpenAPI

````yaml get /model/{id}
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
  /model/{id}:
    get:
      tags:
        - Model
      summary: Get Model
      parameters:
        - in: path
          name: id
          description: ''
          required: true
          schema:
            title: Id
            type: string
          deprecated: false
      responses:
        '200':
          description: Request fulfilled, document follows
          headers: {}
          content:
            application/json:
              schema:
                properties:
                  _id:
                    title: ' Id'
                    type: string
                  type:
                    enum:
                      - svc
                      - tts
                    title: Type
                    type: string
                  title:
                    title: Title
                    type: string
                  description:
                    title: Description
                    type: string
                  cover_image:
                    title: Cover Image
                    type: string
                  train_mode:
                    default: full
                    enum:
                      - fast
                      - full
                    title: Train Mode
                    type: string
                  state:
                    enum:
                      - created
                      - training
                      - trained
                      - failed
                    title: State
                    type: string
                  tags:
                    items:
                      type: string
                    title: Tags
                    type: array
                  samples:
                    default: []
                    items:
                      $ref: '#/components/schemas/SampleEntity'
                    title: Samples
                    type: array
                  created_at:
                    format: date-time
                    title: Created At
                    type: string
                  updated_at:
                    format: date-time
                    title: Updated At
                    type: string
                  languages:
                    default: []
                    items:
                      type: string
                    title: Languages
                    type: array
                  visibility:
                    enum:
                      - public
                      - unlist
                      - private
                    title: Visibility
                    type: string
                  lock_visibility:
                    default: false
                    title: Lock Visibility
                    type: boolean
                  like_count:
                    title: Like Count
                    type: integer
                  mark_count:
                    title: Mark Count
                    type: integer
                  shared_count:
                    title: Shared Count
                    type: integer
                  task_count:
                    title: Task Count
                    type: integer
                  unliked:
                    default: false
                    title: Unliked
                    type: boolean
                  liked:
                    default: false
                    title: Liked
                    type: boolean
                  marked:
                    default: false
                    title: Marked
                    type: boolean
                  author:
                    $ref: '#/components/schemas/AuthorEntity'
                required:
                  - _id
                  - type
                  - title
                  - description
                  - cover_image
                  - state
                  - tags
                  - created_at
                  - updated_at
                  - visibility
                  - like_count
                  - mark_count
                  - shared_count
                  - task_count
                  - author
                type: object
        '404':
          description: Nothing matches the given URI
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
    SampleEntity:
      properties:
        title:
          title: Title
          type: string
        text:
          title: Text
          type: string
        task_id:
          title: Task Id
          type: string
        audio:
          title: Audio
          type: string
      required:
        - title
        - text
        - task_id
        - audio
      title: SampleEntity
      type: object
    AuthorEntity:
      properties:
        _id:
          title: ' Id'
          type: string
        nickname:
          title: Nickname
          type: string
        avatar:
          title: Avatar
          type: string
      required:
        - _id
        - nickname
        - avatar
      title: AuthorEntity
      type: object
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer

````
