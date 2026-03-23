import { DEBOUNCE_TIME } from "@/constants";
import { supabase } from "@/supabase";
import { LocationType } from "@/types";
import * as Crypto from "expo-crypto";
import { useEffect, useRef, useState } from "react";

interface AutocompleteSuggestion {
  placePrediction?: {
    placeId: string;
    text?: { text: string };
    structuredFormat?: {
      mainText?: { text: string };
      secondaryText?: { text: string };
    };
  };
}

interface AutocompleteResponse {
  suggestions?: AutocompleteSuggestion[];
}

export interface PlaceSuggestion {
  placeId: string;
  displayName: string;
  secondaryText: string;
}

interface LocationSearchState {
  suggestions: PlaceSuggestion[];
  loading: boolean;
  error: string | null;
}

export const useLocationSearch = (query: string) => {
  const [state, setState] = useState<LocationSearchState>({
    suggestions: [],
    loading: false,
    error: null,
  });
  const sessionTokenRef = useRef(Crypto.randomUUID());

  const resetSessionToken = () => {
    sessionTokenRef.current = Crypto.randomUUID();
  };

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setState({ suggestions: [], loading: false, error: null });
      return;
    }

    const abortController = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const timeoutId = setTimeout(async () => {
      try {
        const { data, error } =
          await supabase.functions.invoke<AutocompleteResponse>("places", {
            body: {
              action: "autocomplete",
              textQuery: trimmedQuery,
              sessionToken: sessionTokenRef.current,
            },
          });

        if (abortController.signal.aborted) return;

        if (error) throw error;

        const suggestions: PlaceSuggestion[] =
          data?.suggestions
            ?.filter((s) => s.placePrediction?.placeId)
            .map((s) => ({
              placeId: s.placePrediction!.placeId,
              displayName:
                s.placePrediction!.structuredFormat?.mainText?.text ||
                s.placePrediction!.text?.text ||
                "Unknown",
              secondaryText:
                s.placePrediction!.structuredFormat?.secondaryText?.text || "",
            })) ?? [];

        setState({ suggestions, loading: false, error: null });
      } catch {
        if (!abortController.signal.aborted) {
          setState({
            suggestions: [],
            loading: false,
            error: "Couldn't search locations. Please try again.",
          });
        }
      }
    }, DEBOUNCE_TIME);

    return () => {
      abortController.abort();
      clearTimeout(timeoutId);
    };
  }, [query]);

  const getPlaceDetails = async (
    placeId: string,
  ): Promise<LocationType | null> => {
    const { data, error } = await supabase.functions.invoke("places", {
      body: {
        action: "details",
        placeId,
        sessionToken: sessionTokenRef.current,
      },
    });

    // Reset session token after details fetch (end of session)
    resetSessionToken();

    if (error || !data) return null;

    const country = data.addressComponents?.find((comp: any) =>
      comp.types?.includes("country"),
    )?.shortText as LocationType["country"];

    const administrativeAreaLevel1 = data.addressComponents?.find((comp: any) =>
      comp.types?.includes("administrative_area_level_1"),
    )?.longText;

    return {
      id: data.id,
      displayName: data.displayName?.text,
      formattedAddress: data.formattedAddress,
      shortFormattedAddress: data.shortFormattedAddress,
      googleMapsUri: data.googleMapsUri,
      location: data.location,
      country,
      administrativeAreaLevel1,
    };
  };

  return { ...state, getPlaceDetails, resetSessionToken };
};
