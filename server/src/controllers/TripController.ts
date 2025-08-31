import { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';
import { ApiResponse } from '@fleet-management/shared';

interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  startLocation: string;
  endLocation: string;
  startTime: string;
  endTime?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  distance?: number;
  fuelUsed?: number;
}

const trips: Trip[] = [];

export class TripController {
  getAllTrips = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response: ApiResponse<Trip[]> = {
        success: true,
        data: trips,
        message: 'Trips retrieved successfully'
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  getTripById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const trip = trips.find(t => t.id === id);
      
      if (!trip) {
        const error = createError('Trip not found', 404);
        return next(error);
      }
      
      const response: ApiResponse<Trip> = {
        success: true,
        data: trip,
        message: 'Trip retrieved successfully'
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  createTrip = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newTrip: Trip = {
        id: Date.now().toString(),
        ...req.body,
        status: 'ACTIVE'
      };
      
      trips.push(newTrip);
      
      const response: ApiResponse<Trip> = {
        success: true,
        data: newTrip,
        message: 'Trip created successfully'
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
  
  updateTrip = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tripIndex = trips.findIndex(t => t.id === id);
      
      if (tripIndex === -1) {
        const error = createError('Trip not found', 404);
        return next(error);
      }
      
      const updatedTrip = { ...trips[tripIndex], ...req.body };
      trips[tripIndex] = updatedTrip;
      
      const response: ApiResponse<Trip> = {
        success: true,
        data: updatedTrip,
        message: 'Trip updated successfully'
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  deleteTrip = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tripIndex = trips.findIndex(t => t.id === id);
      
      if (tripIndex === -1) {
        const error = createError('Trip not found', 404);
        return next(error);
      }
      
      trips.splice(tripIndex, 1);
      
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Trip deleted successfully'
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
