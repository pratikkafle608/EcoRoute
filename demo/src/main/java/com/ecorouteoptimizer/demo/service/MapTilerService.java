package com.ecorouteoptimizer.demo.service;

import com.ecorouteoptimizer.demo.exception.ExternalApiException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;
import java.util.List;
import java.util.Map;

@Service
public class MapTilerService {

    private static final double MIN_RELEVANCE   = 0.5;
    private static final double MAX_SNAP_METERS = 5000;

    @Autowired private WebClient webClient;
    @Autowired private ApiConfig apiConfig;

    // MapTiler has no routing API, so this geocodes each address with MapTiler and then
    // asks OSRM (open-source routing on OpenStreetMap data, no key needed) for the
    // driving distance between the two points.
    public double getDistanceKm(String origin, String destination) {
        List<Number> from = geocode(origin);
        List<Number> to   = geocode(destination);

        String coords = from.get(0) + "," + from.get(1) + ";" + to.get(0) + "," + to.get(1);
        String url = apiConfig.osrmUrl + "route/v1/driving/" + coords + "?overview=false";

        Map response;
        try {
            response = webClient.get().uri(url).retrieve().bodyToMono(Map.class).block();
        } catch (WebClientResponseException.BadRequest e) {
            // OSRM answers 400 {"code":"NoRoute"} when the points aren't connected by road
            throw new ExternalApiException(
                    "No driving route exists between '" + origin + "' and '" + destination + "'", e);
        } catch (Exception e) {
            throw new ExternalApiException("OSRM routing request failed: " + e.getMessage(), e);
        }

        try {
            List routes = (List) response.get("routes");
            if (!"Ok".equals(response.get("code")) || routes == null || routes.isEmpty()) {
                throw new ExternalApiException(
                        "Could not compute a route between '" + origin + "' and '" + destination + "'");
            }
            // OSRM snaps each point to the nearest road it can reach, even across an ocean
            // (London -> Austin snaps Austin to Portugal), so reject far-off snaps
            for (Object w : (List) response.get("waypoints")) {
                if (((Number) ((Map) w).get("distance")).doubleValue() > MAX_SNAP_METERS) {
                    throw new ExternalApiException(
                            "No driving route exists between '" + origin + "' and '" + destination + "'");
                }
            }
            double meters = ((Number) ((Map) routes.get(0)).get("distance")).doubleValue();
            return meters / 1000.0;
        } catch (ExternalApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ExternalApiException("OSRM returned an unexpected response shape: " + e.getMessage(), e);
        }
    }

    // Returns [longitude, latitude] for the best match of the address
    private List<Number> geocode(String address) {
        String url = UriComponentsBuilder.fromHttpUrl(apiConfig.maptilerUrl)
                .path("geocoding/{query}.json")
                .queryParam("key", apiConfig.maptilerKey)
                .queryParam("limit", 1)
                .buildAndExpand(address)
                .encode()
                .toUriString();

        Map response;
        try {
            response = webClient.get().uri(java.net.URI.create(url)).retrieve().bodyToMono(Map.class).block();
        } catch (Exception e) {
            // Don't echo the URL: it contains the API key
            throw new ExternalApiException("MapTiler geocoding request failed for '" + address + "'", e);
        }

        try {
            List features = (List) response.get("features");
            Map best = (features == null || features.isEmpty()) ? null : (Map) features.get(0);
            // MapTiler always returns its closest fuzzy match; real addresses score ~0.9-1.0,
            // gibberish ~0.4, so treat weak matches as "not found" rather than routing to them
            Number relevance = best == null ? null : (Number) best.get("relevance");
            if (best == null || (relevance != null && relevance.doubleValue() < MIN_RELEVANCE)) {
                throw new ExternalApiException("Could not find a location for '" + address + "'");
            }
            return (List<Number>) best.get("center");
        } catch (ExternalApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ExternalApiException("MapTiler returned an unexpected response shape: " + e.getMessage(), e);
        }
    }
}
