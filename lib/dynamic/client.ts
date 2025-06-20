import axios from 'axios';

export const dynamicClient = axios.create({
  baseURL: 'https://app.dynamicauth.com/api/v0',
  headers: {
    Authorization: `Bearer ${process.env.NEXT_DYNAMIC_BEARER_TOKEN}`,
  },
});
