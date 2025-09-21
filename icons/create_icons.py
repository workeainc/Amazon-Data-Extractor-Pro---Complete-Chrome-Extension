# Amazon Data Extractor Pro - Icon Creation Script
# This script creates placeholder PNG icons for the Chrome extension

import os
from PIL import Image, ImageDraw, ImageFont

def create_icon(size, filename):
    # Create a new image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Calculate scaling factor
    scale = size / 128
    
    # Draw background circle
    margin = 4 * scale
    draw.ellipse([margin, margin, size-margin, size-margin], 
                 fill=(255, 153, 0), outline=(230, 137, 0), width=int(4*scale))
    
    # Draw Amazon arrow (simplified)
    arrow_size = int(20 * scale)
    center_x, center_y = size // 2, size // 2
    
    # Arrow points
    points = [
        (center_x - arrow_size//2, center_y - arrow_size//4),
        (center_x + arrow_size//2, center_y - arrow_size//4),
        (center_x + arrow_size//2, center_y - arrow_size//2),
        (center_x + arrow_size, center_y),
        (center_x + arrow_size//2, center_y + arrow_size//2),
        (center_x + arrow_size//2, center_y + arrow_size//4),
        (center_x - arrow_size//2, center_y + arrow_size//4)
    ]
    
    draw.polygon(points, fill='white')
    
    # Draw data extraction symbols (small squares)
    square_size = int(8 * scale)
    for i in range(6):
        x = int((35 + i * 10) * scale)
        y = int(70 * scale)
        draw.rectangle([x, y, x + square_size, y + square_size], fill='white')
    
    # Draw extraction lines
    for i in range(5):
        start_x = int((35 + i * 10) * scale)
        end_x = int((45 + i * 10) * scale)
        y = int(78 * scale)
        draw.line([start_x, y, end_x, y], fill='white', width=int(2*scale))
    
    # Draw Pro badge
    badge_size = int(12 * scale)
    badge_x = int(100 * scale)
    badge_y = int(28 * scale)
    draw.ellipse([badge_x - badge_size, badge_y - badge_size, 
                  badge_x + badge_size, badge_y + badge_size], 
                 fill=(35, 47, 62))
    
    # Add "P" text
    try:
        font_size = int(10 * scale)
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    draw.text((badge_x, badge_y), 'P', fill='white', font=font, anchor='mm')
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

def main():
    # Create icons directory if it doesn't exist
    os.makedirs('icons', exist_ok=True)
    
    # Create all required icon sizes
    sizes = [16, 32, 48, 128]
    for size in sizes:
        create_icon(size, f'icons/icon{size}.png')
    
    print("All icons created successfully!")

if __name__ == "__main__":
    main()
