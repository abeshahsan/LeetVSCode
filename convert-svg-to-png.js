const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  const conversions = [
    {
      svg: path.join(__dirname, 'resources', 'vs-leet-logo.svg'),
      png: path.join(__dirname, 'resources', 'vs-leet-logo.png')
    },
    {
      svg: path.join(__dirname, 'resources', 'vs-leet-logo-color.svg'),
      png: path.join(__dirname, 'resources', 'vs-leet-logo-color.png')
    }
  ];
  
  for (const {svg, png} of conversions) {
    try {
      await sharp(svg)
        .resize(128, 128)
        .png()
        .toFile(png);
      
      console.log('✓ PNG created successfully at:', png);
    } catch (error) {
      console.error('Error converting', svg, 'to PNG:', error);
    }
  }
}

convertSvgToPng();
