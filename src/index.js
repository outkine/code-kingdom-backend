import 'babel-polyfill'

import helmet from 'helmet'
import express from 'express'
import bodyParser from 'body-parser'
import path from 'path'
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express'
import fs from 'fs'
import cors from 'cors'
import fetch from 'node-fetch'

import graphqlHTTP from 'express-graphql'

import schema from './schema'
import connectMongo from './mongo-connector'

const secrets = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../client_secret.json')))

// app.set('view engine', 'html')
// app.engine('html', handlebars.__express)

// app.use(bodyParser.urlencoded({ extended: true }))

;(async () => {
  const mongo = await connectMongo()

  const app = express()
  if (process.env.NODE_ENV === 'production') {
    app.listen(3002, '127.0.0.1')
    console.log('RUNNING ON http://127.0.0.1:3002/')
  } else {
    app.listen(3000, '127.0.0.1')
    console.log('RUNNING ON http://0.0.0.0:3000/')
  }

  app.use(helmet())
  app.use(cors())
  app.use('/graphql',
    bodyParser.json(),
    async (req, res, next) => {
      req.context = {}

      if (req.get('Authorization')) {
        const response = await fetch(
          'https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + req.get('Authorization').split(' ')[1]
        )
        if (response.status !== 200) {
          res.sendStatus(401)
          return
        }
        const json = await response.json()
        if (json.aud !== secrets.web.client_id || Date.now() > json.exp * 1000) {
          res.sendStatus(401)
          return
        }
        const user = await mongo.Users.findOne({ id: json.sub })
        if (!user) {
          req.context.newUser = json.sub
        } else {
          req.context.user = user
        }
      }
      next()
    },
    // graphqlHTTP(async (req, res) => {
    //   return {
    //     context: { ...req.context, mongo },
    //     schema,
    //     graphiql: true,
    //   }
    // })
    async (req, res, next) => {
      await graphqlExpress({
        context: { ...req.context, mongo },
        schema,
      })(req, res, next)
    }
  )
  app.use('/graphiql', graphiqlExpress({
    endpointURL: '/graphql'
  }))
})()
