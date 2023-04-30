const axios = require('axios')

// !async function checkUrlAccessibility() {
// x (async function checkUrlAccessibility() {
const checkUrlAccessibility = async () => {
  const url = 'https://www.deepl.com/translator';
  try {
    await axios.get(url);
    // await axios.head(url);
    console.log('URL is accessible');
  } catch (error) {
    console.log(error.message)
    console.log('URL is not accessible');
  }
// }()
}

checkUrlAccessibility()
