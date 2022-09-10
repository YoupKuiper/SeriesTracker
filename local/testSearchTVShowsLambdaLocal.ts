import { handler } from '../src/SearchTVShowsLambda'
import 'dotenv/config'

handler({body: '{\"searchString\": \"South Park\"}'}, {})