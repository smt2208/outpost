import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { Task } from "../models/task.models.js";
import { Subtask } from "../models/subtask.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import asyncHandler from "../utils/async-handler.js";
import mongoose from "mongoose";
import { AvailableTaskStatus, TaskStatusEnum } from "../utils/constants.js";

const getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }
  
  const tasks = await Task.find({
    project: new mongoose.Types.ObjectId(projectId),
  }).populate("assignedTo", "avatar username fullName");

  return res
    .status(200)
    .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

const createTask = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, status } = req.body;
  const { projectId } = req.params;
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }
  
  const files = req.files || [];

  const attachments = files.map((file) => {
    return {
      url: `${process.env.SERVER_URL || 'http://localhost:8000'}/images/${file.filename}`,
      mimetype: file.mimetype,
      size: file.size,
    };
  });

  const task = await Task.create({
    title,
    description,
    project: new mongoose.Types.ObjectId(projectId),
    assignedTo: assignedTo
      ? new mongoose.Types.ObjectId(assignedTo)
      : undefined,
    status: status || TaskStatusEnum.TODO,
    assignedBy: new mongoose.Types.ObjectId(req.user._id),
    attachment: attachments, // Using 'attachment' as per Task Schema
  });

  return res
    .status(201)
    .json(new ApiResponse(201, task, "Task created successfully"));
});

const getTaskById = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, "Invalid Task ID");
  }

  const task = await Task.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(taskId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignedTo",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
            }
          },
        ],
      },
    },
    {
      $lookup: {
        from: "subtasks",
        localField: "_id",
        foreignField: "task",
        as: "subtasks",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "createdBy",
              foreignField: "_id",
              as: "createdBy",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              createdBy: {
                $arrayElemAt: ["$createdBy", 0],
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        assignedTo: {
          $arrayElemAt: ["$assignedTo", 0],
        },
      },
    },
  ]);

  if (!task || task.length === 0) {
    throw new ApiError(404, "Task not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, task[0], "Task fetched successfully"));
});

const updateTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { title, description, assignedTo, status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, "Invalid Task ID");
  }

  const taskToUpdate = await Task.findById(taskId);
  if (!taskToUpdate) {
    throw new ApiError(404, "Task not found");
  }

  if (title !== undefined) taskToUpdate.title = title;
  if (description !== undefined) taskToUpdate.description = description;
  if (assignedTo !== undefined) taskToUpdate.assignedTo = assignedTo ? new mongoose.Types.ObjectId(assignedTo) : undefined;
  if (status !== undefined) taskToUpdate.status = status;

  await taskToUpdate.save();

  return res.status(200).json(new ApiResponse(200, taskToUpdate, "Task updated successfully"));
});

const deleteTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, "Invalid Task ID");
  }

  const taskToDelete = await Task.findById(taskId);
  if (!taskToDelete) {
    throw new ApiError(404, "Task not found");
  }

  // Optionally delete all subtasks associated with the task
  await Subtask.deleteMany({ task: taskId });
  await Task.findByIdAndDelete(taskId);

  return res.status(200).json(new ApiResponse(200, {}, "Task deleted successfully"));
});

const createSubTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { title } = req.body;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, "Invalid Task ID");
  }

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const subtask = await Subtask.create({
    title,
    task: taskId,
    createdBy: req.user._id
  });

  return res.status(201).json(new ApiResponse(201, subtask, "Subtask created successfully"));
});

const updateSubTask = asyncHandler(async (req, res) => {
  const { subtaskId } = req.params;
  const { title, isCompleted } = req.body;

  if (!mongoose.Types.ObjectId.isValid(subtaskId)) {
    throw new ApiError(400, "Invalid Subtask ID");
  }

  const subtaskToUpdate = await Subtask.findById(subtaskId);
  if (!subtaskToUpdate) {
    throw new ApiError(404, "Subtask not found");
  }

  if (title !== undefined) subtaskToUpdate.title = title;
  if (isCompleted !== undefined) subtaskToUpdate.isCompleted = isCompleted;

  await subtaskToUpdate.save();

  return res.status(200).json(new ApiResponse(200, subtaskToUpdate, "Subtask updated successfully"));
});

const deleteSubTask = asyncHandler(async (req, res) => {
  const { subtaskId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(subtaskId)) {
    throw new ApiError(400, "Invalid Subtask ID");
  }

  const deletedSubtask = await Subtask.findByIdAndDelete(subtaskId);
  if (!deletedSubtask) {
    throw new ApiError(404, "Subtask not found");
  }

  return res.status(200).json(new ApiResponse(200, {}, "Subtask deleted successfully"));
});

export {
  createSubTask,
  createTask,
  deleteTask,
  deleteSubTask,
  getTaskById,
  getTasks,
  updateSubTask,
  updateTask,
};
