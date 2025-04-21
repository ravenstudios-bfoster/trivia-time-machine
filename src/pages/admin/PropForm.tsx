import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Prop } from "@/types"; // Use Prop type from @/types
import { getProp, createProp, updateProp, deleteFileFromStorage, uploadFile } from "@/lib/firebase"; // Import Firebase functions
import { toast } from "sonner";
import { Loader2 } from "lucide-react"; // Added Loader2

// Define the validation schema using Zod
const propSchema = z.object({
  id: z
    .string()
    .min(1, "ID is required")
    .regex(/^[a-z0-9-]+$/, "ID must be lowercase letters, numbers, and hyphens only"),
  title: z.string().min(1, "Title is required"),
  imageUrl: z.string().url("Must be a valid URL").min(1, "Image URL is required"),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().min(1, "Description is required"),
  movie: z.string().min(1, "Movie is required"),
  backstory: z.string().min(1, "Backstory is required"),
  funFact: z.string().optional(),
  year: z
    .number({ invalid_type_error: "Year must be a number" })
    .int()
    .min(1900, "Year must be after 1900")
    .max(new Date().getFullYear() + 10, "Year seems too far in the future"),
  externalLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  sortOrder: z.number({ invalid_type_error: "Sort order must be a number" }).int().min(0, "Sort order must be 0 or greater"),
});

type PropFormData = z.infer<typeof propSchema>;

const PropForm = () => {
  const { propId } = useParams<{ propId: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(propId);
  const [currentProp, setCurrentProp] = useState<Prop | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(isEditing);
  const [isUploading, setIsUploading] = useState(false);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PropFormData>({
    resolver: zodResolver(propSchema),
    defaultValues: {
      id: "",
      title: "",
      imageUrl: "",
      videoUrl: "",
      description: "",
      movie: "",
      backstory: "",
      funFact: "",
      year: new Date().getFullYear(),
      externalLink: "",
      sortOrder: 0,
    },
  });

  // Watch for changes URL input to update preview
  const watchedImageUrl = watch("imageUrl");
  const watchedVideoUrl = watch("videoUrl");

  useEffect(() => {
    if (watchedImageUrl) {
      if (watchedImageUrl.startsWith("http") || watchedImageUrl.startsWith("/")) {
        setImagePreviewUrl(watchedImageUrl);
      } else {
        setImagePreviewUrl(null);
      }
    } else if (currentProp?.imageUrl) {
      setImagePreviewUrl(currentProp.imageUrl);
    } else {
      setImagePreviewUrl(null);
    }
  }, [watchedImageUrl, currentProp]);

  useEffect(() => {
    if (watchedVideoUrl) {
      if (watchedVideoUrl.startsWith("http") || watchedVideoUrl.startsWith("/")) {
        setVideoPreviewUrl(watchedVideoUrl);
      } else {
        setVideoPreviewUrl(null);
      }
    } else if (currentProp?.videoUrl) {
      setVideoPreviewUrl(currentProp.videoUrl);
    } else {
      setVideoPreviewUrl(null);
    }
  }, [watchedVideoUrl, currentProp]);

  // Fetch prop data when editing
  useEffect(() => {
    if (isEditing && propId) {
      setIsLoadingData(true);
      const fetchPropData = async () => {
        try {
          const propData = await getProp(propId);
          if (propData) {
            setCurrentProp(propData);
            reset(propData);
            setImagePreviewUrl(propData.imageUrl || null);
            setVideoPreviewUrl(propData.videoUrl || null);
          } else {
            toast.error("Prop not found.");
            navigate("/admin/props");
          }
        } catch (error) {
          console.error("Failed to fetch prop data:", error);
          toast.error("Failed to load prop data.");
          navigate("/admin/props");
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchPropData();
    }
  }, [isEditing, propId, reset, navigate]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB");
      return;
    }

    try {
      setIsUploading(true);
      const storagePath = `props/images/${Date.now()}-${file.name}`;
      const imageUrl = await uploadFile(file, storagePath);
      setValue("imageUrl", imageUrl);
      setImagePreviewUrl(imageUrl);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast.error("Please upload a video file");
      return;
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Video file size must be less than 100MB");
      return;
    }

    try {
      setIsUploading(true);
      const storagePath = `props/videos/${Date.now()}-${file.name}`;
      const videoUrl = await uploadFile(file, storagePath);
      setValue("videoUrl", videoUrl);
      setVideoPreviewUrl(videoUrl);
      toast.success("Video uploaded successfully");
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Failed to upload video");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit: SubmitHandler<PropFormData> = async (data) => {
    const finalImageUrl = data.imageUrl;
    const finalVideoUrl = data.videoUrl;
    const originalImageUrl = currentProp?.imageUrl;
    const originalVideoUrl = currentProp?.videoUrl;

    if (!finalImageUrl) {
      toast.error("Image URL is required.");
      return;
    }

    try {
      // Delete old files if they've changed
      if (isEditing) {
        if (originalImageUrl && originalImageUrl !== finalImageUrl) {
          await deleteFileFromStorage(originalImageUrl);
        }
        if (originalVideoUrl && originalVideoUrl !== finalVideoUrl) {
          await deleteFileFromStorage(originalVideoUrl);
        }
      }

      const propDataToSave: Omit<Prop, "id"> = {
        title: data.title,
        imageUrl: finalImageUrl,
        videoUrl: finalVideoUrl || "",
        description: data.description,
        movie: data.movie,
        backstory: data.backstory,
        funFact: data.funFact || "",
        year: data.year,
        externalLink: data.externalLink || "",
        sortOrder: data.sortOrder,
      };

      if (isEditing && propId) {
        await updateProp(propId, propDataToSave);
        toast.success(`Prop '${data.title}' updated successfully.`);
      } else {
        const newProp: Prop = { ...propDataToSave, id: data.id };
        await createProp(newProp);
        toast.success(`Prop '${data.title}' created successfully.`);
      }
      navigate("/admin/props");
    } catch (error) {
      console.error("Error saving prop:", error);
      toast.error("Failed to save prop. Check console for details.");
    }
  };

  // Show loading indicator while fetching data for editing
  if (isLoadingData) {
    return (
      <AdminLayout title="Loading Prop...">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={isEditing ? `Edit Prop: ${currentProp?.title || propId}` : "Add New Prop"}
      breadcrumbs={[
        { label: "Props", href: "/admin/props" },
        { label: isEditing ? "Edit" : "New", href: isEditing ? `/admin/props/${propId}/edit` : "/admin/props/new" },
      ]}
    >
      <Card className="border-[#333] bg-[#111] text-white">
        <CardHeader>
          <CardTitle className="text-white">Prop Details</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* ID Field - Non-editable when editing */}
            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="id" className="text-[#ccc]">
                  Prop ID (Unique, lowercase, hyphens only, cannot be changed)
                </Label>
                <Input id="id" {...register("id")} placeholder="e.g., delorean-time-machine" className="bg-[#222] border-[#444] text-white focus:border-[#FFD700]" />
                {errors.id && <p className="text-red-500 text-sm">{errors.id.message}</p>}
              </div>
            )}
            {isEditing && currentProp && (
              <div className="space-y-2">
                <Label className="text-[#ccc]">Prop ID</Label>
                <p className="text-sm font-mono p-2 rounded bg-[#222] border border-[#444]">{currentProp.id}</p>
              </div>
            )}

            {/* Title Field */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[#ccc]">
                Title
              </Label>
              <Input id="title" {...register("title")} placeholder="e.g., DeLorean Time Machine" className="bg-[#222] border-[#444] text-white focus:border-[#FFD700]" />
              {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
            </div>

            {/* Image Section */}
            <div className="space-y-2">
              <Label className="text-[#ccc]">Prop Image</Label>
              <div className="flex items-center gap-4">
                {/* Image Preview */}
                {imagePreviewUrl && <img src={imagePreviewUrl} alt="Prop preview" className="h-20 w-20 object-cover rounded-sm border border-[#444] bg-[#222]" />}
                {!imagePreviewUrl && (
                  <div className="h-20 w-20 flex items-center justify-center rounded-sm border border-[#444] bg-[#222] text-[#666]">
                    <span>Preview</span>
                  </div>
                )}

                {/* File Upload */}
                <div className="flex-grow">
                  <Input
                    id="imageFile"
                    type="file"
                    accept="image/*"
                    ref={imageFileRef}
                    onChange={handleImageFileChange}
                    className="bg-[#222] border-[#444] text-white focus:border-[#FFD700]"
                    disabled={isUploading}
                  />
                </div>
              </div>
              {/* Combined Error Display for Image */}
              {errors.imageUrl && <p className="text-red-500 text-sm mt-1">{errors.imageUrl.message}</p>}
            </div>

            {/* Video Section */}
            <div className="space-y-2">
              <Label className="text-[#ccc]">Prop Video (Optional)</Label>
              <div className="flex items-center gap-4">
                {/* Video Preview */}
                {videoPreviewUrl && (
                  <video controls className="h-20 w-20 object-cover rounded-sm border border-[#444] bg-[#222]">
                    <source src={videoPreviewUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
                {!videoPreviewUrl && (
                  <div className="h-20 w-20 flex items-center justify-center rounded-sm border border-[#444] bg-[#222] text-[#666]">
                    <span>Preview</span>
                  </div>
                )}

                {/* File Upload */}
                <div className="flex-grow">
                  <Input
                    id="videoFile"
                    type="file"
                    accept="video/*"
                    ref={videoFileRef}
                    onChange={handleVideoFileChange}
                    className="bg-[#222] border-[#444] text-white focus:border-[#FFD700]"
                    disabled={isUploading}
                  />
                </div>
              </div>
              {/* Combined Error Display for Video */}
              {errors.videoUrl && <p className="text-red-500 text-sm mt-1">{errors.videoUrl.message}</p>}
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-[#ccc]">
                Description
              </Label>
              <Textarea id="description" {...register("description")} placeholder="Brief description of the prop." className="bg-[#222] border-[#444] text-white focus:border-[#FFD700]" />
              {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
            </div>

            {/* Movie Field */}
            <div className="space-y-2">
              <Label htmlFor="movie" className="text-[#ccc]">
                Movie
              </Label>
              <Input id="movie" {...register("movie")} placeholder="e.g., Back to the Future Part II" className="bg-[#222] border-[#444] text-white focus:border-[#FFD700]" />
              {errors.movie && <p className="text-red-500 text-sm">{errors.movie.message}</p>}
            </div>

            {/* Backstory Field */}
            <div className="space-y-2">
              <Label htmlFor="backstory" className="text-[#ccc]">
                Backstory
              </Label>
              <Textarea
                id="backstory"
                {...register("backstory")}
                placeholder="Details about the prop's origin and use in the movie."
                className="bg-[#222] border-[#444] text-white focus:border-[#FFD700]"
              />
              {errors.backstory && <p className="text-red-500 text-sm">{errors.backstory.message}</p>}
            </div>

            {/* Fun Fact Field (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="funFact" className="text-[#ccc]">
                Fun Fact (Optional)
              </Label>
              <Textarea id="funFact" {...register("funFact")} placeholder="Interesting trivia about the prop." className="bg-[#222] border-[#444] text-white focus:border-[#FFD700]" />
              {errors.funFact && <p className="text-red-500 text-sm">{errors.funFact.message}</p>}
            </div>

            {/* Year Field */}
            <div className="space-y-2">
              <Label htmlFor="year" className="text-[#ccc]">
                Year
              </Label>
              <Input id="year" type="number" {...register("year", { valueAsNumber: true })} placeholder="e.g., 1985" className="bg-[#222] border-[#444] text-white focus:border-[#FFD700]" />
              {errors.year && <p className="text-red-500 text-sm">{errors.year.message}</p>}
            </div>

            {/* External Link Field (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="externalLink" className="text-[#ccc]">
                External Link (Optional)
              </Label>
              <Input id="externalLink" {...register("externalLink")} placeholder="https://example.com" className="bg-[#222] border-[#444] text-white focus:border-[#FFD700]" />
              {errors.externalLink && <p className="text-red-500 text-sm">{errors.externalLink.message}</p>}
            </div>

            {/* Sort Order Field */}
            <div className="space-y-2">
              <Label htmlFor="sortOrder" className="text-[#ccc]">
                Display Order
              </Label>
              <Input id="sortOrder" type="number" {...register("sortOrder", { valueAsNumber: true })} placeholder="0" className="bg-[#222] border-[#444] text-white focus:border-[#FFD700]" />
              {errors.sortOrder && <p className="text-red-500 text-sm">{errors.sortOrder.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Link to="/admin/props">
              <Button type="button" variant="outline" className="border-[#333] text-[#666] hover:text-white hover:border-white">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting || isLoadingData || isUploading} className="bg-gradient-to-r from-[#FFD700] to-[#FF3D00] text-black hover:opacity-90 min-w-[100px]">
              {isSubmitting || isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditing ? "Save Changes" : "Create Prop"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </AdminLayout>
  );
};

export default PropForm;
