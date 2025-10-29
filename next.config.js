
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'spoonacular.com', 
      'img.spoonacular.com',
      'images.unsplash.com',
      'edamam-product-images.s3.amazonaws.com'
    ],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    MUSICAPI: process.env.MUSICAPI,
    CAREAI: process.env.CAREAI,
    MEALAPI: process.env.MEALAPI,
    NEXT_PUBLIC_MEALAPI: process.env.MEALAPI,
  },
}

module.exports = nextConfig
