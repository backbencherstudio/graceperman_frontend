import { baseApi } from "@/redux/api/baseApi";

export const ImageGenerate = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    imageGen: builder.mutation({
      query: (body) => ({
        url: "/test",
        method: "POST",
        body,
      }),
      // invalidatesTags: ["Auth"],
    }),
  }),
});

export const { useImageGenMutation } = ImageGenerate;
