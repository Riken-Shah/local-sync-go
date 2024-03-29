import os
import pyvips
import time

def create_thumbnail(input_path, output_path, thumbnail_size=100):
    # Open the image using pyvips
    # image = pyvips.Image.new_from_file(input_path)

    # Resize the image to create a thumbnail
    thumbnail = pyvips.Image.thumbnail(input_path,thumbnail_size)

    # Save the thumbnail to the output path
    thumbnail.write_to_file(output_path)

def process_folder(input_folder, output_folder, thumbnail_size=100):
    # Ensure the output folder exists
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    start_time = time.time()

    total_gb_processed = 0

    # Iterate over all files in the input folder
    for filename in os.listdir(input_folder):
        if filename.endswith(".tif") or filename.endswith(".tiff"):
            input_path = os.path.join(input_folder, filename)
            output_path = os.path.join(output_folder, f"thumbnail_{filename}")

            # Create thumbnail for each TIFF file
            create_thumbnail(input_path, output_path, thumbnail_size)
            print(f"Thumbnail created for {filename}")

            # Update total GB processed
            total_gb_processed += os.path.getsize(input_path) / (1024 ** 3)

    end_time = time.time()
    total_time = end_time - start_time

    print(f"Total time taken: {total_time:.2f} seconds")
    print(f"Total GB processed: {total_gb_processed:.2f} GB")

if __name__ == "__main__":
    # Specify the input and output folders
    input_folder = os.path.join("S:", "Digital")
    output_folder = os.path.join("C:", "Users", "Aadi", "Desktop", "outputs")

    # Specify the thumbnail size (in pixels)
    thumbnail_size = 512

    # Process the folder and create thumbnails
    process_folder(input_folder, output_folder, thumbnail_size)
