import { useState, useEffect } from "react";
import { scoreApi } from "../services/api";
import { useToast } from "../hooks/useToast";
import type { User } from "../types";

interface DentalScore {
  patient: string;
  patientName: string;
  overall: number;
  gumHealth: number;
  toothDecay: number;
  alignment: number;
  cleanliness: number;
  recommendations: string[];
  nextCheckupDate: string;
  lastAssessedBy: { name: string; specialization: string };
  lastAssessedAt: string;
  editHistory?: Array<{
    editedAt: string;
    editedBy: { name: string; specialization: string };
    doctorName: string;
    changes: Record<
      string,
      { oldValue: number | string; newValue: number | string }
    >;
    reason: string;
  }>;
}

interface Props {
  patient: User;
  isOpen: boolean;
  onClose: () => void;
}

export default function DentalScoreModal({ patient, isOpen, onClose }: Props) {
  const { toast } = useToast();
  const [score, setScore] = useState<DentalScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [formData, setFormData] = useState({
    overall: 70,
    gumHealth: 70,
    toothDecay: 70,
    alignment: 70,
    cleanliness: 70,
    recommendations: "",
    nextCheckupDate: "",
    reason: "",
  });

  useEffect(() => {
    if (isOpen && patient._id) {
      loadScore();
    }
  }, [isOpen, patient._id]);

  const loadScore = async () => {
    setLoading(true);
    try {
      const res = await scoreApi.getByPatient(patient._id);
      const scoreData = res.data?.data;
      setScore(scoreData);

      // Initialize form with current values
      if (scoreData) {
        setFormData({
          overall: scoreData.overall || 70,
          gumHealth: scoreData.gumHealth || 70,
          toothDecay: scoreData.toothDecay || 70,
          alignment: scoreData.alignment || 70,
          cleanliness: scoreData.cleanliness || 70,
          recommendations: scoreData.recommendations?.join(", ") || "",
          nextCheckupDate: scoreData.nextCheckupDate || "",
          reason: "",
        });
      }
    } catch (err) {
      toast.error("Failed to load dental score");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!score) return;

    if (isEditing && !formData.reason.trim()) {
      toast.error("Please provide a reason for the edit");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        overall: Number(formData.overall),
        gumHealth: Number(formData.gumHealth),
        toothDecay: Number(formData.toothDecay),
        alignment: Number(formData.alignment),
        cleanliness: Number(formData.cleanliness),
        recommendations: formData.recommendations
          .split(",")
          .map((r) => r.trim())
          .filter((r) => r),
        nextCheckupDate: formData.nextCheckupDate || null,
        reason: formData.reason,
      };

      const res = await scoreApi.editScore(patient._id, payload);
      const updatedScore = res.data?.data;
      setScore(updatedScore);
      setIsEditing(false);
      setFormData((prev) => ({ ...prev, reason: "" }));
      toast.success("Dental score updated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update score");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-dental-50 to-mint-50 px-6 py-4 border-b border-surface-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-surface-900">
              Dental Score - {patient.name}
            </h2>
            <p className="text-sm text-surface-500 mt-1">{patient.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-surface-400 hover:text-surface-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && !score ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-dental-400 border-t-dental-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-surface-500">Loading...</p>
              </div>
            </div>
          ) : score ? (
            <>
              {/* Score Display */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-dental/10 p-4 rounded-lg">
                  <p className="text-xs text-surface-500 mb-1">Overall</p>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.overall}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          overall: Number(e.target.value),
                        })
                      }
                      className="input w-full text-lg font-bold"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-dental-600">
                      {score.overall}
                    </p>
                  )}
                </div>

                <div className="bg-mint-50 p-4 rounded-lg">
                  <p className="text-xs text-surface-500 mb-1">Gum Health</p>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.gumHealth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gumHealth: Number(e.target.value),
                        })
                      }
                      className="input w-full text-lg font-bold"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-mint-600">
                      {score.gumHealth}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs text-surface-500 mb-1">Tooth Decay</p>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.toothDecay}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          toothDecay: Number(e.target.value),
                        })
                      }
                      className="input w-full text-lg font-bold"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-blue-600">
                      {score.toothDecay}
                    </p>
                  )}
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-xs text-surface-500 mb-1">Alignment</p>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.alignment}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          alignment: Number(e.target.value),
                        })
                      }
                      className="input w-full text-lg font-bold"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-purple-600">
                      {score.alignment}
                    </p>
                  )}
                </div>

                <div className="bg-amber-50 p-4 rounded-lg">
                  <p className="text-xs text-surface-500 mb-1">Cleanliness</p>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.cleanliness}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cleanliness: Number(e.target.value),
                        })
                      }
                      className="input w-full text-lg font-bold"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-amber-600">
                      {score.cleanliness}
                    </p>
                  )}
                </div>
              </div>

              {/* Last Assessment Info */}
              {score.lastAssessedAt && (
                <div className="bg-surface-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-surface-600">
                    <span className="font-medium">Last Assessed:</span>{" "}
                    {new Date(score.lastAssessedAt).toLocaleDateString()}
                    {score.lastAssessedBy && (
                      <> by {score.lastAssessedBy.name}</>
                    )}
                  </p>
                </div>
              )}

              {/* Edit Form */}
              {isEditing && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-900 mb-2">
                      Next Checkup Date
                    </label>
                    <input
                      type="date"
                      value={formData.nextCheckupDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nextCheckupDate: e.target.value,
                        })
                      }
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-900 mb-2">
                      Recommendations (comma-separated)
                    </label>
                    <textarea
                      value={formData.recommendations}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recommendations: e.target.value,
                        })
                      }
                      placeholder="e.g., Brush twice daily, Floss regularly"
                      className="input w-full h-20 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-900 mb-2">
                      Reason for Edit *
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                      }
                      placeholder="Why are you editing this score?"
                      className="input w-full h-20 resize-none"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {!isEditing && score.recommendations?.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200">
                  <p className="font-medium text-surface-900 mb-2">
                    Recommendations:
                  </p>
                  <ul className="space-y-1">
                    {score.recommendations.map((rec, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-surface-700 flex items-start gap-2"
                      >
                        <span className="text-green-600 mt-1">✓</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Checkup */}
              {!isEditing && score.nextCheckupDate && (
                <div className="bg-amber-50 p-4 rounded-lg mb-6 border border-amber-200">
                  <p className="text-sm text-surface-900">
                    <span className="font-medium">Next Checkup:</span>{" "}
                    {score.nextCheckupDate}
                  </p>
                </div>
              )}

              {/* Edit History Toggle */}
              {score.editHistory && score.editHistory.length > 0 && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-sm text-dental-600 hover:text-dental-700 font-medium"
                  >
                    {showHistory ? "Hide" : "Show"} Edit History (
                    {score.editHistory.length})
                  </button>

                  {showHistory && (
                    <div className="mt-4 space-y-3 bg-gray-50 p-4 rounded-lg">
                      {score.editHistory.map((edit, idx) => (
                        <div
                          key={idx}
                          className="text-sm border-l-2 border-dental-400 pl-3"
                        >
                          <p className="font-medium text-surface-900">
                            {edit.doctorName} -{" "}
                            {new Date(edit.editedAt).toLocaleDateString()}
                          </p>
                          <p className="text-surface-600 text-xs mt-1">
                            {edit.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 btn-primary"
                    >
                      Edit Score
                    </button>
                    <button onClick={onClose} className="flex-1 btn-secondary">
                      Close
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1 btn-primary"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData((prev) => ({ ...prev, reason: "" }));
                      }}
                      className="flex-1 btn-secondary"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-surface-500">
                No dental score found for this patient
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary mt-4"
              >
                Create Score
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
