#!/usr/bin/env node

/**
 * Quick test script for free AI integration
 * Run with: node test-free-ai.js
 */

const axios = require('axios');

async function testHuggingFaceFree() {
  console.log('🧪 Testing Hugging Face Free API...');
  
  const model = 'runwayml/stable-diffusion-v1-5';
  const apiUrl = `https://api-inference.huggingface.co/models/${model}`;
  
  const payload = {
    inputs: 'a beautiful sunset over mountains, digital art',
    parameters: {
      guidance_scale: 7.5,
      num_inference_steps: 20
    },
    options: {
      wait_for_model: true,
      use_cache: false
    }
  };

  try {
    console.log('📡 Sending request to Hugging Face...');
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer',
      timeout: 60000 // 60 second timeout
    });

    if (response.status === 200) {
      console.log('✅ SUCCESS! Hugging Face Free API is working');
      console.log(`📊 Response size: ${response.data.length} bytes`);
      console.log('🎨 Image generated successfully!');
      
      // Save the image for verification
      const fs = require('fs');
      fs.writeFileSync('test-output.png', response.data);
      console.log('💾 Test image saved as test-output.png');
      
      return true;
    } else {
      console.log('❌ Unexpected response status:', response.status);
      return false;
    }
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.status, error.response.statusText);
      if (error.response.data) {
        console.log('📝 Error details:', error.response.data.toString());
      }
    } else if (error.request) {
      console.log('❌ Network Error: No response received');
      console.log('🔍 Check your internet connection');
    } else {
      console.log('❌ Error:', error.message);
    }
    return false;
  }
}

async function testLocalAI() {
  console.log('\n🏠 Testing Local AI connection...');
  
  const endpoint = 'http://localhost:7860';
  
  try {
    const response = await axios.get(`${endpoint}/sdapi/v1/options`, {
      timeout: 5000
    });
    
    if (response.status === 200) {
      console.log('✅ SUCCESS! Local AI (Automatic1111) is running');
      console.log('🔧 Available at:', endpoint);
      return true;
    }
  } catch (error) {
    console.log('❌ Local AI not available at', endpoint);
    console.log('💡 To set up local AI:');
    console.log('   1. Install Automatic1111 WebUI');
    console.log('   2. Run: ./webui.sh --api --cors-allow-origins=*');
    console.log('   3. Or try ComfyUI, Ollama, etc.');
    return false;
  }
}

async function main() {
  console.log('🎨 Retro AI Paint - Free AI Test\n');
  
  const hfResult = await testHuggingFaceFree();
  const localResult = await testLocalAI();
  
  console.log('\n📋 Test Results:');
  console.log(`🌐 Hugging Face Free: ${hfResult ? '✅ Working' : '❌ Failed'}`);
  console.log(`🏠 Local AI: ${localResult ? '✅ Working' : '❌ Not Available'}`);
  
  if (hfResult) {
    console.log('\n🎉 Great! You can use FREE AI generation right now!');
    console.log('👉 Set DEFAULT_AI_PROVIDER=huggingface-free in your .env');
  } else {
    console.log('\n⚠️  Free AI test failed. This might be temporary.');
    console.log('💡 Try again in a few minutes, or check your internet connection.');
  }
  
  if (localResult) {
    console.log('🚀 Local AI is available for unlimited free generation!');
  }
  
  console.log('\n📚 For more help, see FREE_AI_SETUP.md');
}

main().catch(console.error);