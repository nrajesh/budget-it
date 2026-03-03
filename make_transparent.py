from PIL import Image

def make_white_transparent(image_path, output_path):
    img = Image.open(image_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    # Tolerance for "white"
    for item in datas:
        # If pixels are close to white, make them transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")

make_white_transparent("public/logo.png", "public/logo-ui.png")
print("Successfully created logo-ui.png with transparent background.")
