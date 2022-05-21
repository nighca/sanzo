import type { NextApiRequest, NextApiResponse } from 'next'

type Data = string[]

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  res.status(200).json([
    '127.1.1.1', // not ok
    '127.0.0.1'
  ])
}
