> ## Documentation Index
>
> Fetch the complete documentation index at: <https://docs.fish.audio/llms.txt>
> Use this file to discover all available pages before exploring further.

# Get API Credit

> Get current API credit balance

## OpenAPI

````yaml get /wallet/{user_id}/api-credit
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
  /wallet/{user_id}/api-credit:
    get:
      tags:
        - Wallet
      summary: Get API Credit
      parameters:
        - in: query
          name: check_free_credit
          description: ''
          required: false
          schema:
            default: false
            title: Check Free Credit
            type: boolean
          deprecated: false
        - in: path
          name: user_id
          description: User ID or 'self'
          required: false
          schema:
            default: self
            title: User Id
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
                  user_id:
                    title: User Id
                    type: string
                  credit:
                    title: Credit
                    type: string
                  created_at:
                    format: date-time
                    title: Created At
                    type: string
                  updated_at:
                    format: date-time
                    title: Updated At
                    type: string
                  has_phone_sha256:
                    title: Has Phone Sha256
                    type: boolean
                  has_free_credit:
                    anyOf:
                      - type: boolean
                      - type: 'null'
                    default: null
                    title: Has Free Credit
                required:
                  - _id
                  - user_id
                  - credit
                  - created_at
                  - updated_at
                  - has_phone_sha256
                type: object
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
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer

````
