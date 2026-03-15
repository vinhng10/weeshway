import { DEBOUNCE_TIME, GOOGLE_PLACES_API_KEY } from "@/constants";
import { LocationType } from "@/types";
import camelcaseKeys from "camelcase-keys";
import { useEffect, useState } from "react";

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  addressComponents?: Array<{
    types: string[];
    shortText?: string;
    longText?: string;
  }>;
  location?: { latitude: number; longitude: number };
  googleMapsUri?: string;
}

const convertGooglePlaceToLocation = (place: GooglePlace): LocationType => {
  const country = place.addressComponents?.find((comp) =>
    comp.types?.includes("country")
  )?.shortText as LocationType["country"];

  const administrativeAreaLevel1 = place.addressComponents?.find((comp) =>
    comp.types?.includes("administrative_area_level_1")
  )?.longText;

  return {
    id: place.id,
    displayName: place.displayName?.text,
    formattedAddress: place.formattedAddress,
    shortFormattedAddress: place.shortFormattedAddress,
    googleMapsUri: place.googleMapsUri,
    location: place.location,
    country,
    administrativeAreaLevel1,
  };
};

interface LocationSearchState {
  locations: LocationType[];
  loading: boolean;
  error: string | null;
}

export const useLocationSearch = (query: string): LocationSearchState => {
  const [state, setState] = useState<LocationSearchState>({
    locations: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setState({ locations: [], loading: false, error: null });
      return;
    }

    const abortController = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          "https://places.googleapis.com/v1/places:searchText",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
              "X-Goog-FieldMask":
                "places.id,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.addressComponents,places.location,places.googleMapsUri",
            },
            body: JSON.stringify({
              textQuery: trimmedQuery,
            }),
            signal: abortController.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const jsonData = await response.json();
        const data = camelcaseKeys(jsonData, { deep: true });
        const places: GooglePlace[] = data && data.places ? data.places : [];
        const convertedLocations = places.map(convertGooglePlaceToLocation);

        setState({
          locations: convertedLocations,
          loading: false,
          error: null,
        });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setState({
            locations: [],
            loading: false,
            error:
              err instanceof Error ? err.message : "Failed to search locations",
          });
        }
      }
    }, DEBOUNCE_TIME);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [query]);

  return state;
};
