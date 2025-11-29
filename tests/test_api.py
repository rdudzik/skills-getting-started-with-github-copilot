from fastapi.testclient import TestClient
import pytest

from src.app import app, activities

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_activities():
    # make a shallow copy of initial participants and restore after each test
    orig = {k: v["participants"][:] for k, v in activities.items()}
    yield
    for k, v in activities.items():
        v["participants"] = orig[k][:]


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_duplicate():
    activity = "Chess Club"
    email = "newstudent@example.com"

    # signup
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    assert email in activities[activity]["participants"]

    # duplicate signup should return 400
    res2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert res2.status_code == 400


def test_unregister_success_and_not_found():
    activity = "Programming Class"
    existing = activities[activity]["participants"][0]

    # unregister existing participant
    res = client.delete(f"/activities/{activity}/participants?email={existing}")
    assert res.status_code == 200
    assert existing not in activities[activity]["participants"]

    # unregister non-existent should return 404
    res2 = client.delete(f"/activities/{activity}/participants?email=doesnotexist@example.com")
    assert res2.status_code == 404
