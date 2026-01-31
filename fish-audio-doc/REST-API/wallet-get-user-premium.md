> ## Documentation Index
>
> Fetch the complete documentation index at: <https://docs.fish.audio/llms.txt>
> Use this file to discover all available pages before exploring further.

# Get User Premium

> Get current user premium information

## OpenAPI

````yaml get /wallet/{user_id}/package
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
  /wallet/{user_id}/package:
    get:
      tags:
        - Wallet
      summary: Get User Package
      parameters:
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
                  user_id:
                    title: User Id
                    type: string
                  type:
                    title: Type
                    type: string
                  total:
                    title: Total
                    type: integer
                  balance:
                    title: Balance
                    type: integer
                  created_at:
                    title: Created At
                    type: string
                  updated_at:
                    title: Updated At
                    type: string
                  finished_at:
                    title: Finished At
                    type: string
                required:
                  - user_id
                  - type
                  - total
                  - balance
                  - created_at
                  - updated_at
                  - finished_at
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
