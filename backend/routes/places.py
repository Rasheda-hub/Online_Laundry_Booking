from fastapi import APIRouter, HTTPException, Query
import httpx
import os

router = APIRouter(prefix="/places", tags=["places"])

@router.get("/autocomplete")
async def autocomplete_address(
    q: str = Query(..., description="Search query")
):
    """
    Proxy endpoint for OpenStreetMap Nominatim API
    Restricts results to Philippine addresses only
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": f"{q},Philippines",
                    "format": "json",
                    "addressdetails": "1",
                    "limit": "5",
                    "countrycodes": "ph"
                },
                headers={
                    "User-Agent": "LaundryBookingApp/1.0"  # Required by Nominatim
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to fetch from Nominatim API"
                )
            
            data = response.json()
            return data
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request to Nominatim API timed out")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Error connecting to Nominatim API: {str(e)}")
