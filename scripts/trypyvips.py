import os
import pyvips

def create_thumbnail(input_path, output_path, thumbnail_size=100):
    # Open the image using pyvips
    image = pyvips.Image.new_from_file(input_path)

    # Resize the image to create a thumbnail
    thumbnail = image.thumbnail(thumbnail_size)

    # Save the thumbnail to the output path
    thumbnail.write_to_file(output_path)

def process_folder(input_folder, output_folder, thumbnail_size=100):
    # Ensure the output folder exists
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Iterate over all files in the input folder
    for filename in os.listdir(input_folder):
        if filename.endswith(".tif") or filename.endswith(".tiff"):
            input_path = os.path.join(input_folder, filename)
            output_path = os.path.join(output_folder, f"thumbnail_{filename}")

            # Create thumbnail for each TIFF file
            create_thumbnail(input_path, output_path, thumbnail_size)
            print(f"Thumbnail created for {filename}")

if __name__ == "__main__":
    # Specify the input and output folders
    input_folder = os.path.join("S:")
    output_folder = os.path.join("C:", "Users", "Aadi", "Desktop", "outputs")

    # Specify the thumbnail size (in pixels)
    thumbnail_size = 512

    # Process the folder and create thumbnails
    process_folder(input_folder, output_folder, thumbnail_size)
